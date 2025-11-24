
import { Type } from "@google/genai";
import { generateAIContent } from "./geminiService.js";

// --- JSON Schema Definition for the Project Plan ---
const projectPlanSchema = {
    type: Type.OBJECT,
    properties: {
        workBreakdownStructure: {
            type: Type.ARRAY,
            description: "A detailed list of tasks and subtasks for the project's Work Breakdown Structure (WBS).",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The concise name of the main task or phase." },
                    description: { type: Type.STRING, description: "A detailed description of the task." },
                    durationInDays: { type: Type.NUMBER, description: "Estimated days." },
                    assigneeCount: { type: Type.NUMBER, description: "Suggested people count." },
                    subtasks: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                durationInDays: { type: Type.NUMBER }
                            },
                            required: ['name', 'durationInDays']
                        }
                    }
                },
                required: ['name', 'description', 'durationInDays', 'assigneeCount', 'subtasks']
            }
        },
        keyMilestones: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    acceptanceCriteria: { type: Type.STRING },
                    durationInDays: { type: Type.NUMBER },
                     assigneeCount: { type: Type.NUMBER }
                },
                required: ['name', 'acceptanceCriteria', 'durationInDays', 'assigneeCount']
            }
        }
    },
    required: ['workBreakdownStructure', 'keyMilestones']
};

export const generateProjectPlan = async (objective) => {
    const prompt = `Based on the following project objective, create a comprehensive project plan.
    Objective: "${objective}"
    Generate a detailed Work Breakdown Structure (WBS) with logical phases and actionable tasks/subtasks. Also, define a set of key milestones. Ensure the durations and assignee counts are realistic estimates. The output must be valid JSON matching the schema.`;

    const systemInstruction = "You are an expert AI Project Manager. Break down objectives into WBS and Milestones.";

    try {
        const jsonText = await generateAIContent(prompt, projectPlanSchema, systemInstruction);
        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("Error generating project plan:", error);
        throw new Error(`Failed to generate the project plan: ${error.message}`);
    }
};
