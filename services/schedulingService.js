
import { Type } from "@google/genai";
import { generateAIContent } from "./geminiService.js";

const ganttChartSchema = {
    type: Type.ARRAY,
    description: "An array of tasks representing a project schedule with cost and RBS resources.",
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            start: { type: Type.STRING, description: "YYYY-MM-DD" },
            end: { type: Type.STRING, description: "YYYY-MM-DD" },
            progress: { type: Type.NUMBER },
            type: { type: Type.STRING, description: "'project' (Phase/Parent), 'task' (Actionable Item), or 'milestone'" },
            project: { type: Type.STRING, description: "Parent ID. Top level phases should link to 'ROOT-SUMMARY'." },
            dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
            cost: { type: Type.NUMBER, description: "Cost for this specific task" },
            resource: { type: Type.STRING, description: "RBS: 'Name (Type)' e.g., 'Excavator (Equipment)', 'Concrete (Material)', 'Crew A (Labor)'" }
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
        1. **WBS Structure**: 
           - Create a hierarchical ID structure (e.g., Phase 1 ID="1", Task 1.1 ID="1.1"). 
           - Use 'type': 'project' for Phases/Groups. Use 'type': 'task' for actionable work.
           - Ensure 'project' field references the Parent ID correctly.
        
        2. **Resource Breakdown Structure (RBS)**: 
           - Do NOT use generic titles like "Manager" or "Staff" for execution tasks.
           - Resources MUST be categorized as **Labor**, **Material**, or **Equipment**.
           - Format: "Resource Name (Category)". 
           - Examples: "Excavator (Equipment)", "Concrete Mix (Material)", "Steel Beams (Material)", "Masonry Crew (Labor)", "Crane (Equipment)".

        3. **Cost Control (CRITICAL)**: 
           - Distribute costs **only to 'task' items** (leaf nodes). 
           - ${totalBudget > 0 ? `The SUM of all task costs MUST NOT EXCEED ${totalBudget} ${currency}. Ideally, aim for ${totalBudget * 0.95} to leave room for contingency.` : `Estimate realistic costs in ${currency}.`}
           - Do not assign cost to 'project' or 'milestone' types directly (they roll up).

        4. **Dependencies**: 
           - Task B cannot start until Task A finishes. 
           - Ensure logical predecessor linking.

        Return a JSON array matching the schema.
    `;

    const systemInstruction = "You are an expert Construction Project Scheduler & Cost Engineer. You strictly adhere to the Resource Breakdown Structure (RBS) and Budget Constraints.";

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
                resource: 'Project Management'
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
            // This fixes the "sorting not correct" issue by enforcing structure first
            children.sort((a, b) => {
                // Priority 1: ID sequence (if numeric/alphanumeric)
                const aId = parseFloat(a.id);
                const bId = parseFloat(b.id);
                if (!isNaN(aId) && !isNaN(bId)) {
                    return aId - bId;
                }
                // Priority 2: Projects before Tasks
                if (a.type !== b.type) return a.type === 'project' ? -1 : 1;
                // Priority 3: Start Date
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
