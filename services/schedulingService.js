
import { Type } from "@google/genai";
import { generateAIContent } from "./geminiService.js";

const ganttChartSchema = {
    type: Type.ARRAY,
    description: "An array of tasks representing a project schedule with cost and resources.",
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            start: { type: Type.STRING, description: "YYYY-MM-DD" },
            end: { type: Type.STRING, description: "YYYY-MM-DD" },
            progress: { type: Type.NUMBER },
            type: { type: Type.STRING, description: "'project', 'task', or 'milestone'" },
            project: { type: Type.STRING, description: "Parent ID" },
            dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
            cost: { type: Type.NUMBER, description: "Estimated cost for this specific task" },
            resource: { type: Type.STRING, description: "Person or Role assigned (e.g. 'Civil Engineer')" }
        },
        required: ['id', 'name', 'start', 'end', 'progress', 'type', 'cost', 'resource']
    }
};

export const generateScheduleFromPlan = async (projectPlan, criteria) => {
    // Determine Project Start Date
    let projectStartDate;
    if (criteria && criteria.startDate) {
        projectStartDate = criteria.startDate;
    } else {
        // Fallback: Tomorrow
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        projectStartDate = tomorrow.toISOString().split('T')[0];
    }

    const currency = criteria?.currency || 'USD';
    const totalBudget = criteria?.budget || 0;

    let constraints = "";
    if (criteria) {
        if (criteria.finishDate) {
            constraints += `CRITICAL DEADLINE: The project MUST finish by ${criteria.finishDate}. `;
        } else if (criteria.duration) {
            constraints += `CRITICAL CONSTRAINT: The schedule MUST fit within ${criteria.duration} months. `;
        }
    }

    const prompt = `
        Create a detailed, Cost-Loaded and Resource-Loaded Gantt chart schedule starting strictly on ${projectStartDate}.
        ${constraints}
        
        Project Plan: ${JSON.stringify(projectPlan, null, 2)}
        
        Instructions:
        1. **Structure**: Convert WBS items to tasks. Use 'project' for phases/parents, 'task' for actionable items.
        2. **Dates**: Calculate realistic start/end dates based on dependencies.
        3. **Dependencies**: Logic is Key. Task B cannot start until Task A finishes. Populate 'dependencies' array with IDs of predecessors.
        4. **Resource Loading**: Assign a specific Role or Resource Name to every task (e.g., "Site Foreman", "Architect", "Excavator").
        5. **Cost Loading**: Distribute the estimated project value into individual task costs. 
           ${totalBudget > 0 ? `The sum of all task costs MUST equal approximately ${totalBudget} ${currency}.` : `Estimate costs in ${currency}.`}
        
        Return a JSON array matching the schema.
    `;

    const systemInstruction = "You are an expert AI Project Scheduler. You specialize in Critical Path Method (CPM), Resource Allocation, and Cost Estimation.";

    try {
        const jsonText = await generateAIContent(prompt, ganttChartSchema, systemInstruction);
        const scheduleData = JSON.parse(jsonText.trim());

        // Post-processing for hierarchy (same as before)
        const projects = scheduleData.filter(item => item.type === 'project').sort((a, b) => a.start.localeCompare(b.start));
        const tasksByProject = scheduleData.filter(item => item.type === 'task').reduce((acc, task) => {
            const projectId = task.project || 'unassigned';
            if (!acc[projectId]) acc[projectId] = [];
            acc[projectId].push(task);
            return acc;
        }, {});

        const sorted = [];
        projects.forEach(project => {
            sorted.push(project);
            if (tasksByProject[project.id]) sorted.push(...tasksByProject[project.id].sort((a, b) => a.start.localeCompare(b.start)));
        });
        sorted.push(...scheduleData.filter(item => item.type === 'milestone').sort((a,b) => a.start.localeCompare(b.start)));
        if (tasksByProject['unassigned']) sorted.push(...tasksByProject['unassigned'].sort((a,b) => a.start.localeCompare(b.start)));

        return sorted;

    } catch (error) {
        console.error("Error generating project schedule:", error);
        throw new Error(`Failed to generate the project schedule: ${error.message}`);
    }
};
