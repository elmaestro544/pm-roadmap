
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
           ${criteria?.startDate ? `The first task must start on ${criteria.startDate}.` : ""}
        3. **Dependencies**: Logic is Key. Task B cannot start until Task A finishes. Populate 'dependencies' array with IDs of predecessors.
        4. **Resource Loading**: Assign specific **Execution Resources** (Machinery, Equipment, Materials, Labor Crews) required to execute the task.
        5. **Cost Loading**: Distribute costs **only to 'task' items** (leaves). Do NOT assign costs to 'project' (phase) items to avoid double counting.
           ${totalBudget > 0 ? `The sum of all 'task' costs MUST EQUAL approximately ${totalBudget} ${currency}.` : `Estimate costs in ${currency}.`}
        
        Return a JSON array matching the schema.
    `;

    const systemInstruction = "You are an expert AI Project Scheduler. You specialize in Critical Path Method (CPM), Resource Allocation, and Cost Estimation.";

    try {
        const jsonText = await generateAIContent(prompt, ganttChartSchema, systemInstruction);
        let scheduleData = JSON.parse(jsonText.trim());

        // --- Post-Processing for Robust Hierarchy & Rollup ---

        // 1. Sanitize IDs
        scheduleData.forEach(t => t.id = String(t.id));

        // 2. Identify Root
        const rootId = 'ROOT-SUMMARY';
        let rootNode = scheduleData.find(t => t.id === rootId);

        // 3. Helper: Get Default Bounds if missing
        const allStarts = scheduleData.map(t => new Date(t.start).getTime()).filter(d => !isNaN(d));
        const allEnds = scheduleData.map(t => new Date(t.end).getTime()).filter(d => !isNaN(d));
        const defaultStart = allStarts.length ? new Date(Math.min(...allStarts)).toISOString().split('T')[0] : projectStartDate;
        const defaultEnd = allEnds.length ? new Date(Math.max(...allEnds)).toISOString().split('T')[0] : projectStartDate;

        if (!rootNode) {
            rootNode = {
                id: rootId,
                name: "Project Summary: " + (criteria?.title || "Overall Project"),
                start: defaultStart,
                end: defaultEnd,
                progress: 0,
                type: 'project',
                project: null,
                dependencies: [],
                cost: 0,
                resource: 'Project Manager'
            };
            scheduleData.unshift(rootNode);
        }

        // 4. Ensure Hierarchy Connections
        // Reparent top-level items (orphans or explicitly root-linked) to Root
        scheduleData.forEach(t => {
            if (t.id !== rootId && (!t.project || t.project === 'unassigned' || t.project === 'root')) {
                t.project = rootId;
            }
        });

        // 5. Bottom-Up Rollup (Cost, Dates, Progress)
        // We use a map for quick access
        const itemMap = new Map(scheduleData.map(t => [t.id, t]));
        // Build children map
        const childrenMap = new Map();
        scheduleData.forEach(t => {
            if (t.project && t.id !== rootId) { // Avoid self-ref
                if (!childrenMap.has(t.project)) childrenMap.set(t.project, []);
                childrenMap.get(t.project).push(t);
            }
        });

        // DFS Post-Order for Rollup
        const processRollup = (nodeId, visited = new Set()) => {
            if (visited.has(nodeId)) return; // Cycle detection
            visited.add(nodeId);

            const node = itemMap.get(nodeId);
            if (!node) return;

            const children = childrenMap.get(nodeId) || [];
            
            // Process children first (Bottom-Up)
            children.forEach(child => processRollup(child.id, visited));

            // If node is a container (project) or root, aggregate values from children
            if (node.type === 'project' || node.id === rootId) {
                if (children.length > 0) {
                    // Sum Cost (Ensures we don't count the group itself + children)
                    node.cost = children.reduce((sum, c) => sum + (c.cost || 0), 0);
                    
                    // Average Progress (Simple weight)
                    node.progress = Math.round(children.reduce((sum, c) => sum + (c.progress || 0), 0) / children.length);
                    
                    // Min Start
                    const cStarts = children.map(c => new Date(c.start).getTime()).filter(t => !isNaN(t));
                    if (cStarts.length) node.start = new Date(Math.min(...cStarts)).toISOString().split('T')[0];
                    
                    // Max End
                    const cEnds = children.map(c => new Date(c.end).getTime()).filter(t => !isNaN(t));
                    if (cEnds.length) node.end = new Date(Math.max(...cEnds)).toISOString().split('T')[0];
                }
            }
        };

        processRollup(rootId);

        // 6. Force Project Parameters on Root Node (Override AI if strict parameters exist)
        if (criteria?.startDate) rootNode.start = criteria.startDate;
        if (criteria?.finishDate) rootNode.end = criteria.finishDate;
        
        // 7. Flatten for Table/Gantt (Depth calculation)
        const hierarchy = [];
        const visitedDFS = new Set();

        const buildFlatHierarchy = (node, level) => {
            if (visitedDFS.has(node.id)) return;
            visitedDFS.add(node.id);

            hierarchy.push({ ...node, level });

            const children = childrenMap.get(node.id) || [];
            // Sort: Projects/Phases first, then by Start Date
            children.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'project' ? -1 : 1;
                return new Date(a.start) - new Date(b.start);
            });

            children.forEach(child => buildFlatHierarchy(child, level + 1));
        };

        buildFlatHierarchy(rootNode, 0);

        return hierarchy;

    } catch (error) {
        console.error("Error generating project schedule:", error);
        throw new Error(`Failed to generate the project schedule: ${error.message}`);
    }
};
