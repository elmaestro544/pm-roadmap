
import { Type } from "@google/genai";
import { generateAIContent } from "./geminiService.js";

const addDays = (date, days) => { const r = new Date(date); r.setDate(r.getDate() + days); return r; };
const getDaysDiff = (date1, date2) => { const d1 = new Date(date1); d1.setHours(12,0,0,0); const d2 = new Date(date2); d2.setHours(12,0,0,0); return Math.round((d2 - d1) / 86400000); };

export const calculateSCurveData = (scheduleData, totalBudget = 0) => {
    if (!scheduleData || scheduleData.length === 0) return { points: [], totalDays: 0 };
    
    const tasks = scheduleData.filter(t => t.type === 'task');
    if (tasks.length === 0) return { points: [], totalDays: 0 };

    const dates = scheduleData.flatMap(t => [new Date(t.start), new Date(t.end)]);
    const projectStart = new Date(Math.min(...dates));
    const projectEnd = new Date(Math.max(...dates));
    const totalDays = getDaysDiff(projectStart, projectEnd) + 1;
    
    const points = [];
    
    // Simulation variables for AC (Actual Cost) randomness
    let cumulativeAC = 0; 

    for (let i = 0; i < totalDays; i++) {
        const currentDate = addDays(projectStart, i);
        const isFuture = currentDate > new Date();

        // 1. Calculate % Planned (PV %)
        // Simple logic: If current date > task end, task is 100% planned. 
        // If current date < task start, 0%. Else proportional.
        let totalPlannedProgress = 0;
        
        // 2. Calculate % Earned (EV %)
        let totalEarnedProgress = 0;

        tasks.forEach(t => {
            const taskStart = new Date(t.start);
            const taskEnd = new Date(t.end);
            const taskDuration = getDaysDiff(taskStart, taskEnd) + 1;
            
            // PV Calculation
            let plannedPct = 0;
            if (currentDate >= taskEnd) plannedPct = 1;
            else if (currentDate > taskStart) {
                const daysIn = getDaysDiff(taskStart, currentDate) + 1;
                plannedPct = daysIn / taskDuration;
            }
            totalPlannedProgress += plannedPct;

            // EV Calculation
            // We assume linear earning based on reported progress for simplicity here,
            // masked by the timeline. If task is started, we accrue value.
            if (currentDate >= taskStart) {
                // If the task is supposedly "Done" in the future, we cap it at current date unless it's historically done.
                // For S-Curve simulation based on "Current Status":
                // We use the 'progress' field from the schedule. 
                // If today is past, we use the progress. If today is future, we project.
                
                if (!isFuture) {
                    // Historical View
                    const taskProgress = t.progress / 100;
                    // Distribute progress over duration linearly for the sake of the curve
                    // Ideally we'd have historical logs. Here we simulate "ideal" execution up to current %
                    const theoreticalProgressAtDate = Math.min(1, (getDaysDiff(taskStart, currentDate) + 1) / taskDuration);
                    
                    // If the task is actually behind, EV < PV.
                    // We blend actual progress into the timeline.
                    // If task progress is 50%, we assume it reached 50% at 50% duration or now?
                    // Simplified: We use the PV logic but capped at the Tasks's actual Total Progress if date is today.
                    
                    // Better simplification for Viz:
                    // EV accumulates based on (Task Cost * Task Progress) distributed over time?
                    // Let's stick to the previous simple logic but add currency.
                    
                    // Re-using the simple logic from v1 but mapping to budget
                    if (t.progress > 0) {
                         const daysIn = getDaysDiff(taskStart, currentDate) + 1;
                         const pctDuration = Math.min(1, daysIn / taskDuration);
                         // This implies we earn value linearly as time passes, up to the current progress cap?
                         // No, typically EV is just "What % is done".
                         // For a "Curve over time", we need history.
                         // Since we don't have history, we simulate:
                         // "Actual" line tracks "Planned" line exactly until today, then diverges based on SPI?
                         // OR: We just plot the snapshot.
                         
                         // Let's assume Actual tracks Planned but with a random variance factor derived from current Progress vs Duration
                         
                         // Current "Real" SPI for this task
                         const daysElapsed = Math.max(0, getDaysDiff(taskStart, new Date()));
                         const expectedProgress = Math.min(100, (daysElapsed / taskDuration) * 100);
                         const taskSPI = expectedProgress > 0 ? t.progress / expectedProgress : 1;
                         
                         if (currentDate <= new Date()) {
                            // In the past: Apply SPI factor to Planned
                            totalEarnedProgress += (plannedPct * taskSPI);
                         }
                    }
                }
            }
        });

        // Normalize totals
        const plannedPercent = (totalPlannedProgress / tasks.length) * 100;
        
        // Handle EV Calculation
        // Use simpler global progress logic for robustness if individual logic fails
        // If we are in the future, Actual is null (line stops)
        let actualPercent = null;
        if (!isFuture) {
             actualPercent = (totalEarnedProgress / tasks.length) * 100;
             // Clamp
             actualPercent = Math.min(100, Math.max(0, actualPercent));
             
             // Simulate AC (Actual Cost)
             // Usually AC > EV if over budget.
             // We'll simulate a CPI of 0.95 to 1.05 fluctuation
             const dailyCost = (totalBudget / totalDays) * (actualPercent / 100); // Rough approximation
             cumulativeAC += dailyCost * (1 + (Math.random() * 0.1 - 0.02)); // Random variance
        }

        const pv = (plannedPercent / 100) * totalBudget;
        const ev = actualPercent !== null ? (actualPercent / 100) * totalBudget : null;
        const ac = actualPercent !== null ? (ev / (0.9 + Math.random() * 0.2)) : null; // Simulated AC around CPI 1.0

        points.push({ 
            day: i + 1, 
            date: currentDate.toISOString().split('T')[0], 
            planned: parseFloat(plannedPercent.toFixed(2)), 
            actual: actualPercent !== null ? parseFloat(actualPercent.toFixed(2)) : null,
            // EVM Metrics
            pv: pv,
            ev: ev,
            ac: ac,
            spi: pv > 0 ? (ev / pv).toFixed(2) : 1,
            cpi: ac > 0 ? (ev / ac).toFixed(2) : 1
        });
    }
    
    // Fix: Ensure the last point reaches 100% planned if not already
    if (points.length > 0) {
        points[points.length - 1].planned = 100;
    }

    return { points, totalDays, totalBudget };
};

const sCurveAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        analysis: { type: Type.STRING },
        outlook: { type: Type.STRING }
    },
    required: ['analysis', 'outlook']
};

export const getSCurveAnalysis = async (sCurveData) => {
    const dataSample = sCurveData.points.filter((_, i) => i % Math.max(1, Math.ceil(sCurveData.points.length / 10)) === 0);
    const prompt = `Analyze S-Curve data: ${JSON.stringify(dataSample)}. Compare planned vs actual progress. Provide analysis and outlook. Return JSON.`;
    const systemInstruction = "You are an AI Project Analyst. Analyze S-Curve data.";

    try {
        const jsonText = await generateAIContent(prompt, sCurveAnalysisSchema, systemInstruction);
        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("Error generating S-Curve analysis:", error);
        throw new Error("Failed to generate AI analysis.");
    }
};

export const generateSCurveReport = async (scheduleData, totalBudget = 0) => {
    try {
        const sCurveData = calculateSCurveData(scheduleData, totalBudget);
        const analysis = await getSCurveAnalysis(sCurveData);
        return { sCurveData, analysis };
    } catch (error) {
        console.error("Error in S-Curve generation:", error);
        throw error;
    }
};
