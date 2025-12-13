
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
            resource: { type: Type.STRING, description: "Execution Resource (Machinery, Equipment, Material) e.g. 'Excavator'" }
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
        4. **Resource Loading**: Assign specific **Execution Resources** (Machinery, Equipment, Materials, Labor Crews) required to execute the task (e.g., "Excavator", "Concrete Mixer", "Paving Machine", "Server Rack"). Do NOT simply list staff titles like "Manager" or "Engineer" unless it refers to a specific crew.
        5. **Cost Loading**: Distribute costs realistically. ${totalBudget > 0 ? `The sum of all task costs MUST EQUAL the Total Budget of ${totalBudget} ${currency}.` : `Estimate realistic costs in ${currency} based on the scope.`}
        
        Return a JSON array matching the schema.
    `;

    const systemInstruction = "You are an expert AI Project Scheduler. You specialize in Critical Path Method (CPM), Resource Allocation, and Cost Estimation.";

    try {
        const jsonText = await generateAIContent(prompt, ganttChartSchema, systemInstruction);
        let scheduleData = JSON.parse(jsonText.trim());

        // --- Post-Processing for Robust Hierarchy ---

        // 1. Sanitize IDs
        scheduleData.forEach(t => t.id = String(t.id));

        // 2. Ensure Root Node Exists
        const rootId = 'ROOT-SUMMARY';
        let rootNode = scheduleData.find(t => t.id === rootId);

        if (!rootNode) {
            // Determine bounds from all items
            const starts = scheduleData.map(t => new Date(t.start).getTime()).filter(d => !isNaN(d));
            const ends = scheduleData.map(t => new Date(t.end).getTime()).filter(d => !isNaN(d));
            const minStart = starts.length ? new Date(Math.min(...starts)) : new Date(projectStartDate);
            const maxEnd = ends.length ? new Date(Math.max(...ends)) : new Date(projectStartDate);
            
            // Calculate aggregations
            const totalCost = scheduleData.reduce((acc, t) => acc + (t.cost || 0), 0);
            const tasks = scheduleData.filter(t => t.type === 'task');
            const avgProgress = tasks.length > 0 
                ? tasks.reduce((acc, t) => acc + (t.progress || 0), 0) / tasks.length 
                : 0;

            rootNode = {
                id: rootId,
                name: "Project Summary: " + (criteria?.title || "Overall Project"),
                start: minStart.toISOString().split('T')[0],
                end: maxEnd.toISOString().split('T')[0],
                progress: Math.round(avgProgress),
                type: 'project',
                project: null,
                dependencies: [],
                cost: totalCost,
                resource: 'Project Manager'
            };
            
            // Re-parent top-level items to Root
            scheduleData.forEach(t => {
                if (!t.project || t.project === 'unassigned' || t.project === 'root') {
                    t.project = rootId;
                }
            });
            scheduleData.unshift(rootNode);
        }

        // 3. Build DFS Sorted Hierarchy with Levels
        const hierarchy = [];
        const visited = new Set();

        const processNode = (node, level) => {
            if (visited.has(node.id)) return;
            visited.add(node.id);

            const nodeWithLevel = { ...node, level };
            hierarchy.push(nodeWithLevel);

            // Find children
            const children = scheduleData.filter(t => t.project === node.id);
            
            // Sort Children: Projects(Phases) first, then Tasks, then by Start Date
            children.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'project' ? -1 : 1;
                return new Date(a.start) - new Date(b.start);
            });

            children.forEach(child => processNode(child, level + 1));
        };

        // Start from Root
        processNode(rootNode, 0);

        // Capture orphans (circular deps or bad parent IDs from AI)
        const orphans = scheduleData.filter(t => !visited.has(t.id));
        if (orphans.length > 0) {
            orphans.forEach(t => {
                t.project = rootId; // Force attach
                processNode(t, 1);
            });
        }

        return hierarchy;

    } catch (error) {
        console.error("Error generating project schedule:", error);
        throw new Error(`Failed to generate the project schedule: ${error.message}`);
    }
};
