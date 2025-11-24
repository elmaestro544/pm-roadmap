
import { Type } from "@google/genai";
import { generateAIContent } from "./geminiService.js";

const budgetEstimationSchema = {
    type: Type.OBJECT,
    properties: {
        budgetItems: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING },
                    description: { type: Type.STRING },
                    laborHours: { type: Type.NUMBER },
                    laborCost: { type: Type.NUMBER },
                    materialsCost: { type: Type.NUMBER },
                    contingencyPercent: { type: Type.NUMBER }
                },
                required: ['category', 'description', 'laborHours', 'laborCost', 'materialsCost', 'contingencyPercent']
            }
        }
    },
    required: ['budgetItems']
};

export const generateProjectBudget = async (projectDetails) => {
    const { objectives, currency, budgetCap, contingency, scope } = projectDetails;

    const prompt = `
        Create a detailed budget breakdown.
        Objectives: "${objectives}"
        Scope: "${scope}"
        Currency: ${currency || 'USD'}
        Contingency: ${contingency || '10'}%
        Generate 5-8 budget items with labor/material splits. Return JSON.
    `;

    const systemInstruction = "You are an expert AI Financial Analyst. Generate detailed project budgets.";

    try {
        const jsonText = await generateAIContent(prompt, budgetEstimationSchema, systemInstruction);
        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("Error generating project budget:", error);
        throw new Error(`Failed to generate the project budget: ${error.message}`);
    }
};
