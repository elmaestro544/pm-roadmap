
import { Type } from "@google/genai";
import { generateAIContent } from "./geminiService.js";

// --- Local Calculation Functions (Unchanged) ---
const getDaysDiff = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(12, 0, 0, 0);
    d2.setHours(12, 0, 0, 0);
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
};

export const calculateKpis = (scheduleData, budgetData) => {
    if (!scheduleData || scheduleData.length === 0 || !budgetData?.budgetItems) {
        return { overallProgress: 0, scheduleVariance: 0, costVariance: 0, budgetAtCompletion: 0, plannedDuration: 0, spi: 1, cpi: 1 };
    }
    const totalBudget = budgetData.budgetItems.reduce((sum, item) => sum + item.laborCost + item.materialsCost + ((item.laborCost + item.materialsCost) * (item.contingencyPercent / 100)), 0);
    const dates = scheduleData.flatMap(t => [new Date(t.start), new Date(t.end)]);
    const plannedDuration = getDaysDiff(new Date(Math.min(...dates)), new Date(Math.max(...dates)));
    const percentDurationElapsed = Math.max(0, Math.min(100, (getDaysDiff(new Date(Math.min(...dates)), new Date()) / plannedDuration) * 100));
    const overallProgress = scheduleData.reduce((acc, task) => acc + task.progress, 0) / scheduleData.length;
    
    const plannedValue = totalBudget * (percentDurationElapsed / 100);
    const earnedValue = totalBudget * (overallProgress / 100);
    const actualCost = earnedValue * 1.08; 

    return {
        overallProgress: parseFloat(overallProgress.toFixed(1)),
        scheduleVariance: parseFloat((earnedValue - plannedValue).toFixed(2)),
        costVariance: parseFloat((earnedValue - actualCost).toFixed(2)),
        spi: parseFloat((plannedValue > 0 ? (earnedValue / plannedValue) : 1).toFixed(2)),
        cpi: parseFloat((actualCost > 0 ? (earnedValue / actualCost) : 1).toFixed(2)),
        budgetAtCompletion: parseFloat(totalBudget.toFixed(2)),
        plannedDuration: plannedDuration
    };
};

const kpiAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "Brief health summary." },
        recommendation: { type: Type.STRING, description: "One actionable recommendation." }
    },
    required: ['summary', 'recommendation']
};

export const getKpiAnalysis = async (kpis) => {
    const prompt = `Analyze these KPIs: SPI: ${kpis.spi}, CPI: ${kpis.cpi}, SV: ${kpis.scheduleVariance}. Provide concise summary and recommendation. Return JSON.`;
    const systemInstruction = "You are an AI Project Management Analyst. Analyze KPIs and provide structured insights.";

    try {
        const jsonText = await generateAIContent(prompt, kpiAnalysisSchema, systemInstruction);
        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("Error generating KPI analysis:", error);
        throw new Error("Failed to generate AI analysis for the KPIs.");
    }
};

export const generateKpiReport = async (scheduleData, budgetData) => {
    try {
        const kpis = calculateKpis(scheduleData, budgetData);
        const analysis = await getKpiAnalysis(kpis);
        return { kpis, analysis };
    } catch (error) {
        console.error("Error in KPI data generation process:", error);
        throw error;
    }
};
