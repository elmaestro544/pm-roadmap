
import { Type } from "@google/genai";
import { generateAIContent } from "./geminiService.js";

const addDays = (date, days) => { const r = new Date(date); r.setDate(r.getDate() + days); return r; };
const getDaysDiff = (date1, date2) => { const d1 = new Date(date1); d1.setHours(12,0,0,0); const d2 = new Date(date2); d2.setHours(12,0,0,0); return Math.round((d2 - d1) / 86400000); };

export const calculateSCurveData = (scheduleData) => {
    if (!scheduleData || scheduleData.length === 0) return { points: [], totalDays: 0 };
    const tasks = scheduleData.filter(t => t.type === 'task');
    if (tasks.length === 0) return { points: [], totalDays: 0 };
    const dates = scheduleData.flatMap(t => [new Date(t.start), new Date(t.end)]);
    const projectStart = new Date(Math.min(...dates));
    const totalDays = getDaysDiff(projectStart, new Date(Math.max(...dates))) + 1;
    const points = [];
    
    for (let i = 0; i < totalDays; i++) {
        const currentDate = addDays(projectStart, i);
        const planned = (tasks.filter(t => new Date(t.end) <= currentDate).length / tasks.length) * 100;
        let earned = 0;
        tasks.forEach(t => {
             const dur = getDaysDiff(t.start, t.end) + 1;
             const into = getDaysDiff(t.start, currentDate) + 1;
             if (into > 0) earned += (t.progress / 100);
        });
        points.push({ day: i + 1, date: currentDate.toISOString().split('T')[0], planned: parseFloat(planned.toFixed(2)), actual: parseFloat(((earned / tasks.length) * 100).toFixed(2)) });
    }
    return { points, totalDays };
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
    const prompt = `Analyze S-Curve data: ${JSON.stringify(dataSample)}. Compare planned vs actual. Provide analysis and outlook. Return JSON.`;
    const systemInstruction = "You are an AI Project Analyst. Analyze S-Curve data.";

    try {
        const jsonText = await generateAIContent(prompt, sCurveAnalysisSchema, systemInstruction);
        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("Error generating S-Curve analysis:", error);
        throw new Error("Failed to generate AI analysis.");
    }
};

export const generateSCurveReport = async (scheduleData) => {
    try {
        const sCurveData = calculateSCurveData(scheduleData);
        const analysis = await getSCurveAnalysis(sCurveData);
        return { sCurveData, analysis };
    } catch (error) {
        console.error("Error in S-Curve generation:", error);
        throw error;
    }
};
