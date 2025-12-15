
import { Type } from "@google/genai";
import { generateAIContent } from "./geminiService.js";

const riskAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        risks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    projectName: { type: Type.STRING },
                    date: { type: Type.STRING, description: "Identification date YYYY-MM-DD" },
                    startDate: { type: Type.STRING, description: "Estimated risk onset YYYY-MM-DD" },
                    endDate: { type: Type.STRING, description: "Estimated risk closure/mitigation YYYY-MM-DD" },
                    severity: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                    likelihood: { type: Type.STRING, enum: ['Certain', 'Likely', 'Possible', 'Unlikely', 'Rare'] },
                    impact: { type: Type.STRING, enum: ['Critical', 'Major', 'Moderate', 'Minor'] },
                    mitigationStrategies: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING }
                            },
                             required: ['name', 'description']
                        }
                    }
                },
                required: ['id', 'title', 'description', 'projectName', 'date', 'severity', 'likelihood', 'impact', 'mitigationStrategies']
            }
        }
    },
    required: ['risks']
};

export const analyzeProjectRisks = async (objective) => {
    const prompt = `Analyze risks for Project Objective: "${objective}". Identify 5-8 risks.
    For each risk, estimate a 'startDate' (when it might occur relative to project start) and 'endDate' (when it might be resolved or passed).
    Assume the project starts next month.
    Classify severity/likelihood/impact, and suggest mitigations. Return JSON.`;
    const systemInstruction = "You are an expert AI Risk Management analyst. Identify and classify project risks with timeline projections.";

    try {
        const jsonText = await generateAIContent(prompt, riskAnalysisSchema, systemInstruction);
        const data = JSON.parse(jsonText.trim());
        
        // Post-process to ensure dates exist if AI misses them (fallback)
        const today = new Date();
        data.risks = data.risks.map((r, i) => {
            if (!r.startDate) {
                const start = new Date(today);
                start.setMonth(today.getMonth() + (i % 3)); // Stagger starts
                r.startDate = start.toISOString().split('T')[0];
            }
            if (!r.endDate) {
                const start = new Date(r.startDate);
                start.setMonth(start.getMonth() + 1 + (i % 2)); // 1-2 months duration
                r.endDate = start.toISOString().split('T')[0];
            }
            return r;
        });
        
        return data;
    } catch (error) {
        console.error("Error generating risk analysis:", error);
        throw new Error("Failed to generate the risk analysis.");
    }
};
