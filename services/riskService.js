
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
                    date: { type: Type.STRING },
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
    const prompt = `Analyze risks for Project Objective: "${objective}". Identify 5-8 risks, classify severity/likelihood/impact, and suggest mitigations. Return JSON.`;
    const systemInstruction = "You are an expert AI Risk Management analyst. Identify and classify project risks.";

    try {
        const jsonText = await generateAIContent(prompt, riskAnalysisSchema, systemInstruction);
        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("Error generating risk analysis:", error);
        throw new Error("Failed to generate the risk analysis.");
    }
};
