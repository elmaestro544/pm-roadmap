
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

export const generateProjectBudget = async (projectDetails, criteria) => {
    const { objectives, scope } = projectDetails;
    const currency = criteria?.currency || 'USD';
    const budgetCap = criteria?.budget;
    const budgetType = criteria?.budgetType; // Fixed or Predicted

    let budgetConstraint = "";
    if (budgetCap) {
        if (budgetType === 'Fixed') {
            budgetConstraint = `
            CRITICAL - FIXED BUDGET: The project has a strictly FIXED budget of ${currency} ${budgetCap}.
            You MUST distribute funds such that the sum of (Labor Cost + Materials Cost + Contingency) across all items EQUALS EXACTLY ${budgetCap} (within 1% margin).
            Do NOT create a budget that exceeds this amount. Allocations must fit this envelope.
            `;
        } else {
            budgetConstraint = `
            GUIDELINE: The target baseline budget is ${currency} ${budgetCap}. 
            Use this as a reference point for your estimation, but you may adjust if the scope realistically requires more or less.
            `;
        }
    } else {
        budgetConstraint = `ESTIMATE: No budget cap provided. Estimate realistic total costs based on industry standards for this scope in ${currency}.`;
    }

    const prompt = `
        Create a detailed budget breakdown for a project.
        Objectives: "${objectives}"
        Scope: "${scope}"
        Currency: ${currency}
        
        ${budgetConstraint}
        
        Instructions:
        1. Generate 5-8 distinct budget items/categories.
        2. Provide realistic labor hours, labor costs, and material costs.
        3. Include a contingency percentage for each item.
        4. Ensure the currency context (${currency}) is reflected in the scale of numbers (e.g., 1 USD != 1 JPY).
        
        Return JSON.
    `;

    const systemInstruction = "You are an expert AI Financial Analyst and Project Estimator. You strictly adhere to budget constraints when specified.";

    try {
        const jsonText = await generateAIContent(prompt, budgetEstimationSchema, systemInstruction);
        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("Error generating project budget:", error);
        throw new Error(`Failed to generate the project budget: ${error.message}`);
    }
};
