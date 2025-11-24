
import { Type } from "@google/genai";
import { generateAIContent } from "./geminiService.js";

const level3Node = {
    type: Type.OBJECT,
    properties: { name: { type: Type.STRING }, type: { type: Type.STRING } },
    required: ['name', 'type']
};
const level2Node = {
    type: Type.OBJECT,
    properties: { name: { type: Type.STRING }, type: { type: Type.STRING }, children: { type: Type.ARRAY, items: level3Node } },
    required: ['name', 'type']
};
const level1Node = {
    type: Type.OBJECT,
    properties: { name: { type: Type.STRING }, type: { type: Type.STRING }, children: { type: Type.ARRAY, items: level2Node } },
    required: ['name', 'type']
};
const structureSchema = {
    type: Type.OBJECT,
    properties: {
        projectName: { type: Type.STRING },
        root: {
            type: Type.OBJECT,
            properties: { name: { type: Type.STRING }, type: { type: Type.STRING }, children: { type: Type.ARRAY, items: level1Node } },
            required: ['name', 'type']
        }
    },
    required: ['projectName', 'root']
};

export const generateProjectStructure = async (objective) => {
    const prompt = `Analyze: "${objective}". Design a hierarchical skeleton of core components (3 levels deep). Return JSON.`;
    const systemInstruction = "You are an expert AI Systems Architect. Decompose projects into hierarchical tree structures.";

    try {
        const jsonText = await generateAIContent(prompt, structureSchema, systemInstruction);
        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("Error generating project structure:", error);
        throw new Error("Failed to generate the project structure.");
    }
};
