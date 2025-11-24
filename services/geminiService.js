


import { GoogleGenAI, Modality, Type } from "@google/genai";
import { getUserSettings } from "./supabaseClient.js";

// --- Configuration Helper ---

export const getAiSettings = () => {
    try {
        const settings = localStorage.getItem('adminSettings');
        return settings ? JSON.parse(settings) : {};
    } catch (e) {
        return {};
    }
};

// Internal Sync Helpers (for fallback)
const getAdminProvider = () => {
    const settings = getAiSettings();
    return settings.aiProvider || 'google';
};

const getAdminApiKey = () => {
    const settings = getAiSettings();
    const provider = getAdminProvider();
    if (provider === 'google') {
        return (settings.aiApiKey && settings.aiApiKey.trim() !== '') ? settings.aiApiKey : window.process?.env?.API_KEY;
    }
    return settings.aiApiKey;
};

const getAdminModelId = (defaultModel = 'gemini-2.5-flash') => {
    const settings = getAiSettings();
    return settings.aiModel || defaultModel;
};

// --- API Helpers ---

const mapTypeToSchema = (type) => {
    switch(type) {
        case Type.STRING: return 'string';
        case Type.NUMBER: return 'number';
        case Type.INTEGER: return 'integer';
        case Type.BOOLEAN: return 'boolean';
        case Type.ARRAY: return 'array';
        case Type.OBJECT: return 'object';
        default: return 'string';
    }
};

const convertSchemaToStandardJson = (geminiSchema) => {
    if (!geminiSchema) return null;
    
    const schema = { type: mapTypeToSchema(geminiSchema.type) };
    
    if (geminiSchema.description) schema.description = geminiSchema.description;
    if (geminiSchema.enum) schema.enum = geminiSchema.enum;
    
    if (geminiSchema.items) {
        schema.items = convertSchemaToStandardJson(geminiSchema.items);
    }
    
    if (geminiSchema.properties) {
        schema.properties = {};
        for (const [key, prop] of Object.entries(geminiSchema.properties)) {
            schema.properties[key] = convertSchemaToStandardJson(prop);
        }
        if (geminiSchema.required) {
            schema.required = geminiSchema.required;
        }
        schema.additionalProperties = false; 
    }
    
    return schema;
};

// --- Provider Implementations ---

const generateGoogleContent = async (client, model, prompt, schema, systemInstruction) => {
    const config = {
        systemInstruction: systemInstruction,
    };
    
    if (schema) {
        config.responseMimeType = "application/json";
        config.responseSchema = schema;
    }

    const result = await client.models.generateContent({
        model: model,
        contents: { parts: [{ text: prompt }] },
        config: config,
    });
    return result.text;
};

const generateOpenAICompatibleContent = async (baseUrl, apiKey, model, prompt, schema, systemInstruction) => {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };
    
    if (baseUrl.includes('openrouter')) {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'PM Roadmap';
    }

    const body = {
        model: model,
        messages: [
            { role: "system", content: systemInstruction || "You are a helpful assistant." },
            { role: "user", content: prompt }
        ],
        temperature: 0.7
    };

    if (schema) {
        const jsonSchema = convertSchemaToStandardJson(schema);
        if (baseUrl.includes('openai.com')) {
            body.response_format = {
                type: "json_schema",
                json_schema: {
                    name: "response",
                    strict: true,
                    schema: jsonSchema
                }
            };
        } else {
            body.response_format = { type: "json_object" };
            body.messages[0].content += `\n\nIMPORTANT: Return valid JSON matching this schema:\n${JSON.stringify(jsonSchema)}`;
        }
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`AI API Error: ${response.status} ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
};

// --- Main Exported Function ---

export const generateAIContent = async (prompt, schema, systemInstruction = "You are a helpful assistant.") => {
    // 1. Try to get User Specific Settings from Supabase
    let provider = null;
    let apiKey = null;
    let model = null;

    try {
        const userSettings = await getUserSettings();
        if (userSettings && userSettings.aiApiKey) {
            provider = userSettings.aiProvider || 'google';
            apiKey = userSettings.aiApiKey;
            model = userSettings.aiModel || 'gemini-2.5-flash';
        }
    } catch (e) {
        // Ignore user settings fetch error, fallback to admin
        console.warn("Could not fetch user settings, using defaults.", e);
    }

    // 2. Fallback to Admin / Global Settings
    if (!apiKey) {
        provider = getAdminProvider();
        apiKey = getAdminApiKey();
        model = getAdminModelId();
    }

    if (!apiKey) throw new Error(`${provider} API Key is missing. Check User or Admin Settings.`);

    // Route to appropriate provider
    if (provider === 'google') {
        const client = new GoogleGenAI({ apiKey });
        return await generateGoogleContent(client, model, prompt, schema, systemInstruction);
    } 
    else if (provider === 'openai') {
        return await generateOpenAICompatibleContent('https://api.openai.com/v1', apiKey, model, prompt, schema, systemInstruction);
    }
    else if (provider === 'openrouter') {
        return await generateOpenAICompatibleContent('https://openrouter.ai/api/v1', apiKey, model, prompt, schema, systemInstruction);
    }
    else if (provider === 'perplexity') {
        return await generateOpenAICompatibleContent('https://api.perplexity.ai', apiKey, model, prompt, schema, systemInstruction);
    }
    
    throw new Error(`Unknown provider: ${provider}`);
};


// --- Fetch Available Models ---

export const fetchAvailableModels = async (provider, apiKey) => {
    if (!apiKey) throw new Error("API Key required");

    if (provider === 'google') {
        return [
            { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
            { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
            { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" }
        ];
    }
    
    let url = '';
    let headers = { 'Authorization': `Bearer ${apiKey}` };

    if (provider === 'openai') url = 'https://api.openai.com/v1/models';
    if (provider === 'openrouter') url = 'https://openrouter.ai/api/v1/models';
    if (provider === 'perplexity') url = 'https://api.perplexity.ai/models';

    try {
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error("Failed to fetch models");
        const data = await res.json();
        
        if (data.data) {
             return data.data.map(m => ({ id: m.id, name: m.name || m.id }));
        }
        return [];
    } catch (e) {
        if (provider === 'perplexity') return [{ id: 'sonar-pro', name: 'Sonar Pro' }, { id: 'sonar', name: 'Sonar' }];
        if (provider === 'openai') return [{ id: 'gpt-4o', name: 'GPT-4o' }, { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }, { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }];
        throw e;
    }
};

// --- Legacy / Specific Exports ---

// These legacy checks still look at local environment for "System Health"
export const isAnyModelConfigured = () => !!getAdminApiKey();
export const isModelConfigured = () => !!getAdminApiKey();

export const getProvider = getAdminProvider;
export const getApiKey = getAdminApiKey;
export const getModelId = getAdminModelId;

// --- Chat Session Helper ---
// Note: Real-time chat still relies on specific Google Client init or specific keys.
// For now, we use the Admin Key for chat or generic content generation.

export const getGeminiClient = () => {
    const provider = getAdminProvider();
    if (provider !== 'google') return null;
    const apiKey = getAdminApiKey();
    return new GoogleGenAI({ apiKey });
};

export const createChatSession = () => {
    // Only Google supports the stateful chat session object in this SDK
    if (getProvider() === 'google') {
        const client = getGeminiClient();
        const model = getModelId('gemini-2.5-flash');
        if (client) {
             return client.chats.create({ 
                model: model,
                config: { systemInstruction: "You are an expert AI assistant." }
            });
        }
    }
    return { isGeneric: true }; 
};

export const sendChatMessage = async (chatSession, message, file, useWebSearch) => {
    // Note: Chat implementation currently defaults to Admin/Env settings for now due to complexity of streaming with user settings sync.
    // Ideally this should also await getUserSettings() but keeping synchronous flow for chat session object creation.
    
    const provider = getProvider();
    
    if (provider === 'google') {
        const client = getGeminiClient(); 
        if (!client) throw new Error("Google Client not init");
        const model = getModelId('gemini-2.5-flash');

        const messageParts = [{ text: message }];
        if (file) {
            const base64EncodedDataPromise = new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(file);
            });
            messageParts.unshift({ inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } });
        }

        if (useWebSearch) {
            const result = await client.models.generateContent({
                model: model,
                contents: { parts: messageParts },
                config: { tools: [{ googleSearch: {} }] },
            });
            return { text: result.text, sources: result.candidates?.[0]?.groundingMetadata?.groundingChunks || [], isStream: false };
        } else {
            const stream = await chatSession.sendMessageStream({ message: { parts: messageParts } });
            return { stream, isStream: true };
        }
    } 
    else {
        // Simple one-off call using generic handler (which DOES check user settings)
        const responseText = await generateAIContent(message, null, "You are a helpful AI assistant for project management.");
        return { text: responseText, isStream: false, sources: [] };
    }
};

// ... (Audio helpers remain unchanged) ...
function encode(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(data, ctx, sampleRate, numChannels) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function createPcmBlob(data) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const startVoiceSession = (callbacks) => {
    if (getProvider() !== 'google') {
        throw new Error("Voice Chat is only available with Google Gemini provider.");
    }
    const client = getGeminiClient();
    const sessionPromise = client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        },
    });
    return sessionPromise;
};