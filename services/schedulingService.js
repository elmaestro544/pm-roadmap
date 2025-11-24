
import { Type } from "@google/genai";
import { generateAIContent } from "./geminiService.js";

const ganttChartSchema = {
    type: Type.ARRAY,
    description: "An array of tasks representing a project schedule.",
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
            dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['id', 'name', 'start', 'end', 'progress', 'type']
    }
};

export const generateScheduleFromPlan = async (projectPlan) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const projectStartDate = tomorrow.toISOString().split('T')[0];

    const prompt = `
        Create a Gantt chart schedule starting ${projectStartDate}.
        Project Plan: ${JSON.stringify(projectPlan, null, 2)}
        Instructions: Convert WBS items/milestones to tasks. Assign 'id', 'start', 'end' dates. 'type' should be 'project' for phases, 'task' for items. Establish dependencies. Return JSON array.
    `;

    const systemInstruction = "You are an expert AI Project Scheduler. Convert plans to Gantt schedules.";

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
