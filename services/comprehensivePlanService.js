
import { Type } from "@google/genai";
import { generateAIContent } from "./geminiService.js";

const consultingPlanSchema = {
    type: Type.OBJECT,
    properties: {
        projectTitle: { type: Type.STRING },
        executiveSummary: { type: Type.STRING },
        standardsAndMethodologies: { type: Type.STRING },
        scopeAndObjectives: { type: Type.STRING },
        governanceStructure: {
             type: Type.OBJECT,
             properties: { rolesAndResponsibilities: { type: Type.STRING }, raciMatrix: { type: Type.STRING } },
             required: ['rolesAndResponsibilities', 'raciMatrix']
        },
        executionStrategy: { type: Type.STRING },
        riskAndChangeManagement: { type: Type.STRING },
        qualityAssuranceAndKPIs: { type: Type.STRING },
        lessonsLearnedMechanism: { type: Type.STRING },
        conclusion: { type: Type.STRING }
    },
    required: ['projectTitle', 'executiveSummary', 'standardsAndMethodologies', 'scopeAndObjectives', 'governanceStructure', 'executionStrategy', 'riskAndChangeManagement', 'qualityAssuranceAndKPIs', 'lessonsLearnedMechanism', 'conclusion']
};

export const generateConsultingPlan = async (details) => {
    const { field, name, scope, location } = details;
    const prompt = `
        Build a professional Project Management Plan.
        Project: "${name}", Field: "${field}", Scope: "${scope}", Location: "${location}".
        Include: Executive Summary, Standards (PMI/ISO), Governance (RACI), Risk, QA, Lessons Learned.
        Output as JSON with Markdown text content.
    `;
    const systemInstruction = "You are a world-class Project Management Consultant. Generate professional project plans in JSON.";

    try {
        const jsonText = await generateAIContent(prompt, consultingPlanSchema, systemInstruction);
        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("Error generating project plan:", error);
        throw new Error("Failed to generate the project plan.");
    }
};
