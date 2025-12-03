
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

export const generateProjectPlan = async (objective, criteria) => {
    let constraintText = "";
    if (criteria) {
        if (criteria.duration) {
            constraintText += `\nCONSTRAINT: The total project duration MUST strictly fit within ${criteria.duration} months. Adjust task durations accordingly.`;
        } else {
            constraintText += `\nINSTRUCTION: Estimate a realistic duration for this project scope.`;
        }
        
        if (criteria.startDate) {
            constraintText += `\nSTART DATE: ${criteria.startDate}. Plan phases starting from this date.`;
        }
        if (criteria.finishDate) {
            constraintText += `\nDEADLINE: ${criteria.finishDate}. All work must be completed by this date.`;
        }
        
        if (criteria.budget) {
            const type = criteria.budgetType === 'Fixed' ? "Strict Constraint" : "Guideline";
            constraintText += `\n${type}: Total Budget is ${criteria.currency} ${criteria.budget}. Ensure the scale of the WBS reflects this.`;
        }
    }

    const prompt = `Based on the following project objective, create a comprehensive project plan.
    Objective: "${objective}"
    ${constraintText}
    
    IMPORTANT INSTRUCTIONS:
    1. Generate a detailed Work Breakdown Structure (WBS) that MUST START FROM PHASE 1 (e.g., Planning/Mobilization/Design). DO NOT START FROM THE MIDDLE.
    2. Cover the full lifecycle including execution and closure.
    3. Include at least 4-5 main phases/tasks in chronological order.
    4. Each main task MUST have subtasks.
    5. Define at least 3-4 key milestones.
    6. Ensure the durations and assignee counts are realistic estimates based on the objective.
    7. Return ONLY valid JSON matching the schema, do not include any markdown formatting.
    
    The output must be valid JSON matching the schema.`;

    const systemInstruction = "You are an expert AI Project Manager. Break down objectives into WBS and Milestones. Always return pure JSON.";

    try {
        const jsonText = await generateAIContent(prompt, projectPlanSchema, systemInstruction);
        // Robust cleanup: remove any Markdown code blocks that might sneak in
        const cleanedText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        
        // Basic validation to prevent "missing data" issues if AI returns empty arrays
        if (!parsed.workBreakdownStructure || parsed.workBreakdownStructure.length === 0) {
            throw new Error("AI returned empty Work Breakdown Structure. Please try again with a more detailed objective.");
        }
        
        return parsed;
    } catch (error) {
        console.error("Error generating project plan:", error);
        throw new Error(`Failed to generate the project plan: ${error.message}`);
    }
};
