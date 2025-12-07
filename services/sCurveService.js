import { Type } from "@google/genai";
import { generateAIContent } from "./geminiService.js";

const addDays = (date, days) => { const r = new Date(date); r.setDate(r.getDate() + days); return r; };
const getDaysDiff = (date1, date2) => { const d1 = new Date(date1); d1.setHours(12,0,0,0); const d2 = new Date(date2); d2.setHours(12,0,0,0); return Math.round((d2 - d1) / 86400000); };

// Helper to aggregate daily points into larger intervals
const aggregateDataByInterval = (dailyPoints, interval) => {
    if (!dailyPoints || dailyPoints.length === 0) return [];
    if (interval === 'days') return dailyPoints;

    const aggregated = [];
    let currentBucket = null;

    dailyPoints.forEach((point) => {
        const date = new Date(point.date);
        let bucketKey = '';

        if (interval === 'weeks') {
            // ISO Week number or just start of week
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            const startOfWeek = new Date(date.setDate(diff));
            bucketKey = startOfWeek.toISOString().split('T')[0];
        } else if (interval === 'months') {
            bucketKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
        } else if (interval === 'quarters') {
            const q = Math.floor(date.getMonth() / 3) + 1;
            const startMonth = (q - 1) * 3;
            bucketKey = `${date.getFullYear()}-${String(startMonth + 1).padStart(2, '0')}-01`;
        }

        if (!currentBucket || currentBucket.date !== bucketKey) {
            if (currentBucket) aggregated.push(currentBucket);
            // Start new bucket with current point's CUMULATIVE values
            // Ideally for S-Curve, the point represents the value at the END of the period.
            currentBucket = { ...point, date: bucketKey, label: bucketKey };
        } else {
            // Update current bucket with latest cumulative values
            currentBucket.planned = point.planned;
            currentBucket.actual = point.actual;
            currentBucket.pv = point.pv;
            currentBucket.ev = point.ev;
            currentBucket.ac = point.ac;
            currentBucket.spi = point.spi;
            currentBucket.cpi = point.cpi;
        }
    });
    if (currentBucket) aggregated.push(currentBucket);
    return aggregated;
};

export const calculateSCurveData = (scheduleData, totalBudget = 0, interval = 'days') => {
    if (!scheduleData || scheduleData.length === 0) return { points: [], totalDays: 0 };
    
    const tasks = scheduleData.filter(t => t.type === 'task');
    if (tasks.length === 0) return { points: [], totalDays: 0 };

    const dates = scheduleData.flatMap(t => [new Date(t.start), new Date(t.end)]);
    const projectStart = new Date(Math.min(...dates));
    const projectEnd = new Date(Math.max(...dates));
    const totalDays = getDaysDiff(projectStart, projectEnd) + 1;
    
    const dailyPoints = [];
    
    // Simulation variables
    let cumulativeAC = 0; 

    for (let i = 0; i < totalDays; i++) {
        const currentDate = addDays(projectStart, i);
        const isFuture = currentDate > new Date();

        let totalPlannedProgress = 0;
        let totalEarnedProgress = 0;

        tasks.forEach(t => {
            const taskStart = new Date(t.start);
            const taskEnd = new Date(t.end);
            const taskDuration = Math.max(1, getDaysDiff(taskStart, taskEnd) + 1);
            
            // PV Calculation (Planned % Complete)
            let plannedPct = 0;
            if (currentDate >= taskEnd) plannedPct = 1;
            else if (currentDate > taskStart) {
                const daysIn = getDaysDiff(taskStart, currentDate) + 1;
                plannedPct = daysIn / taskDuration;
            }
            totalPlannedProgress += plannedPct;

            // EV Calculation (Earned % Complete)
            if (currentDate >= taskStart && !isFuture) {
                 if (t.progress > 0) {
                     // Current "Real" status snapshot
                     const daysElapsed = Math.max(0, getDaysDiff(taskStart, new Date()));
                     const expectedProgress = Math.min(100, (daysElapsed / taskDuration) * 100);
                     // Calculate SPI for this task
                     const taskSPI = expectedProgress > 0 ? t.progress / expectedProgress : 1;
                     
                     // Apply SPI to the planned curve up to today to simulate "Actual" curve
                     // If today is past the task end, and task is done, EV=1.
                     
                     // Simple Model: If task is complete, EV=1. If in progress, use % reported.
                     // But for historical points (i < today), we need a curve.
                     // We interpolate linearly from 0 to current %.
                     const daysSinceStart = getDaysDiff(taskStart, currentDate);
                     const daysSinceStartTotal = getDaysDiff(taskStart, new Date());
                     
                     const currentActualPct = t.progress / 100;
                     
                     if (daysSinceStartTotal > 0) {
                        const interpolated = (daysSinceStart / daysSinceStartTotal) * currentActualPct;
                        totalEarnedProgress += Math.min(currentActualPct, Math.max(0, interpolated));
                     }
                 }
            }
        });

        const plannedPercent = (totalPlannedProgress / tasks.length) * 100;
        
        let actualPercent = null;
        if (!isFuture) {
             actualPercent = (totalEarnedProgress / tasks.length) * 100;
             actualPercent = Math.min(100, Math.max(0, actualPercent));
             
             // Simulate AC (Actual Cost)
             // Roughly assume AC tracks EV but with some noise/CPI factor
             const dailyCost = (totalBudget / totalDays) * (actualPercent / 100); 
             cumulativeAC += dailyCost * (1 + (Math.random() * 0.1 - 0.05));
        }

        const pv = (plannedPercent / 100) * totalBudget;
        const ev = actualPercent !== null ? (actualPercent / 100) * totalBudget : null;
        const ac = actualPercent !== null ? (ev / (0.95 + Math.random() * 0.1)) : null; // Simulating CPI ~1.0

        dailyPoints.push({ 
            day: i + 1, 
            date: currentDate.toISOString().split('T')[0], 
            planned: parseFloat(plannedPercent.toFixed(2)), 
            actual: actualPercent !== null ? parseFloat(actualPercent.toFixed(2)) : null,
            pv: pv,
            ev: ev,
            ac: ac,
            spi: pv > 0 ? (ev / pv).toFixed(2) : 1,
            cpi: ac > 0 ? (ev / ac).toFixed(2) : 1
        });
    }
    
    // Ensure 100% at end for planned
    if (dailyPoints.length > 0) {
        dailyPoints[dailyPoints.length - 1].planned = 100;
    }

    // Aggregation based on interval
    const finalPoints = aggregateDataByInterval(dailyPoints, interval);

    return { points: finalPoints, totalDays, totalBudget };
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

export const generateSCurveReport = async (scheduleData, totalBudget = 0, interval = 'days') => {
    try {
        const sCurveData = calculateSCurveData(scheduleData, totalBudget, interval);
        const analysis = await getSCurveAnalysis(sCurveData);
        return { sCurveData, analysis };
    } catch (error) {
        console.error("Error in S-Curve generation:", error);
        throw error;
    }
};