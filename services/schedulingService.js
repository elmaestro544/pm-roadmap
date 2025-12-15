
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

// --- Helper: Date Arithmetic ---
const addDays = (dateStr, days) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

const getDayDiff = (d1Str, d2Str) => {
    const d1 = new Date(d1Str);
    const d2 = new Date(d2Str);
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
};

// --- CPM Logic ---
export const calculateCriticalPath = (tasks) => {
    // 1. Map for easy access
    const taskMap = new Map();
    // Filter out summary tasks for calculation, or handle them gently. 
    // CPM is usually best run on leaf nodes, but we'll include all to calculate float.
    tasks.forEach(t => taskMap.set(t.id, { ...t, duration: getDayDiff(t.start, t.end), es: 0, ef: 0, ls: 0, lf: 0, float: 0, successors: [] }));

    // 2. Build Graph (Successors)
    tasks.forEach(t => {
        if (t.dependencies) {
            t.dependencies.forEach(depId => {
                const pred = taskMap.get(depId);
                if (pred) pred.successors.push(t.id);
            });
        }
    });

    const sortedIds = Array.from(taskMap.keys()); // Topological sort ideally, but simple iteration often works for DAGs if we multi-pass or recursive.
    
    // 3. Forward Pass (Early Start / Early Finish)
    // We need to traverse based on dependencies. 
    const visitedForward = new Set();
    const calcForward = (taskId) => {
        if (visitedForward.has(taskId)) return;
        visitedForward.add(taskId);

        const task = taskMap.get(taskId);
        
        let maxPredEf = 0; // Default start relative 0
        if (task.dependencies && task.dependencies.length > 0) {
            task.dependencies.forEach(depId => {
                if (!visitedForward.has(depId)) calcForward(depId);
                const pred = taskMap.get(depId);
                if (pred && pred.ef > maxPredEf) maxPredEf = pred.ef;
            });
        }
        
        task.es = maxPredEf;
        task.ef = task.es + Math.max(1, task.duration); // Min duration 1 day
    };

    tasks.forEach(t => calcForward(t.id));
    
    // Project Duration
    const projectDuration = Math.max(...Array.from(taskMap.values()).map(t => t.ef));

    // 4. Backward Pass (Late Start / Late Finish)
    const visitedBackward = new Set();
    const calcBackward = (taskId) => {
        if (visitedBackward.has(taskId)) return;
        visitedBackward.add(taskId);

        const task = taskMap.get(taskId);
        
        let minSuccLs = projectDuration;
        
        if (task.successors.length > 0) {
            task.successors.forEach(succId => {
                if (!visitedBackward.has(succId)) calcBackward(succId);
                const succ = taskMap.get(succId);
                if (succ && succ.ls < minSuccLs) minSuccLs = succ.ls;
            });
            task.lf = minSuccLs;
        } else {
            // If no successors, LF is project finish
            task.lf = projectDuration;
        }
        
        task.ls = task.lf - Math.max(1, task.duration);
        task.float = task.ls - task.es;
    };

    // Start backward pass from end tasks (no successors) or all tasks
    tasks.forEach(t => calcBackward(t.id));

    // 5. Mark Critical and Return
    return tasks.map(t => {
        const calculated = taskMap.get(t.id);
        // Float close to 0 (allow small margin for float rounding)
        const isCritical = calculated.float <= 0; 
        
        return { 
            ...t, 
            isCritical,
            // Expose CPM details for Matrix View
            cpm: {
                es: calculated.es,
                ef: calculated.ef,
                ls: calculated.ls,
                lf: calculated.lf,
                float: calculated.float,
                duration: calculated.duration
            }
        };
    });
};

// --- Corrective Actions ---
export const applyCorrectiveAction = (tasks, type) => {
    // Re-run CPM to ensure we are targeting current critical path
    const analyzedTasks = calculateCriticalPath(tasks);
    const criticalTasks = analyzedTasks.filter(t => t.isCritical && t.type === 'task');

    if (criticalTasks.length === 0) return analyzedTasks;

    // Helper to get numeric cost
    const getCost = (t) => t.cost || 0;

    let modifiedTasks = [...analyzedTasks];

    if (type === 'crash') {
        // CRASHING: Reduce duration of critical tasks, increase cost.
        // Heuristic: Crash the critical tasks with the longest duration first (usually easiest to trim).
        criticalTasks.sort((a, b) => getDayDiff(b.start, b.end) - getDayDiff(a.start, a.end));
        
        // Crash top 30% of critical tasks
        const tasksToCrash = criticalTasks.slice(0, Math.ceil(criticalTasks.length * 0.3));
        
        modifiedTasks = modifiedTasks.map(t => {
            if (tasksToCrash.find(c => c.id === t.id)) {
                const currentDuration = getDayDiff(t.start, t.end);
                if (currentDuration > 1) {
                    const newDuration = Math.floor(currentDuration * 0.75); // Reduce by 25%
                    const daysRemoved = currentDuration - newDuration;
                    
                    // Cost increase (Crashing cost): e.g., 20% increase for 25% time savings
                    const newCost = getCost(t) * 1.2;
                    
                    // Adjust End Date
                    const newEnd = addDays(t.start, newDuration);
                    
                    return { ...t, end: newEnd, cost: newCost, name: `${t.name} (Crashed)` };
                }
            }
            return t;
        });
    } 
    else if (type === 'fast-track') {
        // FAST-TRACKING: Overlap critical tasks.
        // Find critical tasks that depend on other critical tasks
        const criticalIds = new Set(criticalTasks.map(t => t.id));
        
        modifiedTasks = modifiedTasks.map(t => {
            if (criticalIds.has(t.id) && t.dependencies?.length > 0) {
                // If it depends on another critical task, pull start date back
                const hasCriticalPred = t.dependencies.some(d => criticalIds.has(d));
                if (hasCriticalPred) {
                    const currentStart = new Date(t.start);
                    const currentEnd = new Date(t.end);
                    const duration = getDayDiff(t.start, t.end);
                    
                    // Overlap by 20% of duration
                    const shiftDays = Math.ceil(duration * 0.2); 
                    
                    const newStart = addDays(t.start, -shiftDays);
                    const newEnd = addDays(t.end, -shiftDays);
                    
                    return { ...t, start: newStart, end: newEnd, name: `${t.name} (Fast-Tracked)` };
                }
            }
            return t;
        });
    }

    // After modifying durations/dates, we need to ripple the changes through the schedule
    // This is a complex operation (Rescheduling). 
    // For this prototype, we will return the Modified tasks and assume the Visualizer connects lines based on ID.
    // However, to be accurate, we should ideally re-run a forward pass to adjust dates of successors.
    // Simplifying: The user sees the specific changes, and we mark them.
    
    // Recalculate rollup to update costs/progress of parent containers
    const scheduled = calculateCriticalPath(modifiedTasks);
    return recalculateScheduleHierarchy(scheduled);
};

// --- Hierarchy Rollup Logic ---
export const recalculateScheduleHierarchy = (flatTasks) => {
    // 1. Create a map for quick lookups and deep cloning to avoid direct mutation issues during traversal
    const taskMap = new Map();
    flatTasks.forEach(t => taskMap.set(t.id, { ...t }));

    // 2. Build Parent -> Children map
    const childrenMap = new Map();
    flatTasks.forEach(t => {
        // 'project' field holds the parent ID
        if(t.project && t.project !== 'root' && t.project !== t.id) {
            if(!childrenMap.has(t.project)) childrenMap.set(t.project, []);
            childrenMap.get(t.project).push(t.id);
        }
    });

    // 3. Process Logic: Depth-First Search (Post-Order Traversal)
    // This ensures we calculate children before parents
    const processedIds = new Set();

    const processNode = (taskId) => {
        if (processedIds.has(taskId)) return taskMap.get(taskId);
        
        const childrenIds = childrenMap.get(taskId) || [];
        
        // If leaf node (task/milestone), return as is
        if (childrenIds.length === 0) {
            processedIds.add(taskId);
            return taskMap.get(taskId);
        }

        // Process children first
        let totalCost = 0;
        let weightedProgressSum = 0;
        let totalProgressSimple = 0;
        let activeChildCount = 0;
        let startDateTimes = [];
        let endDateTimes = [];

        const processedChildren = childrenIds.map(childId => processNode(childId));

        processedChildren.forEach(child => {
            // Cost Summation
            const cost = child.cost || 0;
            const prog = child.progress || 0;
            
            // Logic: Only Tasks contribute to weight, projects are containers
            // But since this is recursive, a sub-project's cost is the sum of its tasks
            totalCost += cost;
            
            // Weighted Progress Accumulation
            weightedProgressSum += (prog * cost);
            totalProgressSimple += prog;
            activeChildCount++;
            
            // Date Rollup (Min/Max)
            if(child.start) startDateTimes.push(new Date(child.start).getTime());
            if(child.end) endDateTimes.push(new Date(child.end).getTime());
        });

        const node = taskMap.get(taskId);
        
        // Update Cost (Summation)
        node.cost = totalCost;

        // Update Progress (Weighted by Cost)
        if (totalCost > 0) {
            node.progress = Math.round(weightedProgressSum / totalCost);
        } else if (activeChildCount > 0) {
            // Fallback if no cost assigned (simple average)
            node.progress = Math.round(totalProgressSimple / activeChildCount);
        } else {
            node.progress = 0;
        }

        // Update Dates (Rollup)
        if (startDateTimes.length) {
            node.start = new Date(Math.min(...startDateTimes)).toISOString().split('T')[0];
        }
        if (endDateTimes.length) {
            node.end = new Date(Math.max(...endDateTimes)).toISOString().split('T')[0];
        }

        processedIds.add(taskId);
        return node;
    };

    // Trigger processing for all nodes. 
    // Since processNode is memoized with processedIds, calling it on every node is safe/efficient.
    flatTasks.forEach(t => processNode(t.id));

    // Return the updated tasks in original order
    return flatTasks.map(t => taskMap.get(t.id));
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

        // 5. Initial Rollup (Cost, Dates, Progress) using the new centralized logic
        scheduleData = recalculateScheduleHierarchy(scheduleData);

        // 6. Force Project Parameters on Root Node (Override AI if strict parameters exist)
        const updatedRoot = scheduleData.find(t => t.id === rootId);
        if (updatedRoot) {
            if (criteria?.startDate) updatedRoot.start = criteria.startDate;
            if (criteria?.finishDate) updatedRoot.end = criteria.finishDate;
        }
        
        // 7. Flatten for Table/Gantt (Depth calculation)
        const itemMap = new Map(scheduleData.map(t => [t.id, t]));
        const childrenMap = new Map();
        scheduleData.forEach(t => {
            if (t.project && t.id !== rootId) { 
                if (!childrenMap.has(t.project)) childrenMap.set(t.project, []);
                childrenMap.get(t.project).push(t);
            }
        });

        const hierarchy = [];
        const visitedDFS = new Set();

        // Get fresh reference to root
        const freshRoot = itemMap.get(rootId);

        const buildFlatHierarchy = (node, level) => {
            if (visitedDFS.has(node.id)) return;
            visitedDFS.add(node.id);

            hierarchy.push({ ...node, level });

            const children = childrenMap.get(node.id) || [];
            // Sort: Projects/Phases first, then by Start Date
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

        buildFlatHierarchy(freshRoot, 0);

        // 8. FINAL STEP: Calculate Critical Path
        const finalSchedule = calculateCriticalPath(hierarchy);

        return finalSchedule;

    } catch (error) {
        console.error("Error generating project schedule:", error);
        throw new Error(`Failed to generate the project schedule: ${error.message}`);
    }
};
