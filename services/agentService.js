
import { Type } from "@google/genai";
import { generateAIContent } from "./geminiService.js";

const vendorOfferSchema = {
    type: Type.OBJECT,
    properties: {
        offers: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    partner: { type: Type.STRING },
                    description: { type: Type.STRING },
                    value: { type: Type.NUMBER },
                    deliveryTime: { type: Type.STRING },
                    location: { type: Type.STRING },
                    status: { type: Type.STRING, enum: ['External', 'Internal'] }
                },
                required: ['partner', 'description', 'value', 'deliveryTime', 'location', 'status']
            }
        }
    },
    required: ['offers']
};

export const generateVendorOffers = async (request) => {
    const prompt = `Find vendor offers for: "${request}". Generate 3-5 realistic offers with price, location, delivery. Return JSON.`;
    const systemInstruction = "You are an expert AI Procurement Agent. Generate suitable vendor offers.";

    try {
        const jsonText = await generateAIContent(prompt, vendorOfferSchema, systemInstruction);
        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("Error generating vendor offers:", error);
        throw new Error("Failed to generate vendor offers.");
    }
};
