import { GoogleGenAI, Modality, Type } from "@google/genai";
import { getUserSettings, getEnv } from "./supabaseClient.js";

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
        // Try User Settings (Admin override) first, then fallback to Environment Variable
        const envKey = getEnv('API_KEY');
        return (settings.aiApiKey && settings.aiApiKey.trim() !== '') ? settings.aiApiKey : envKey;
    }
    return settings.aiApiKey;
};

const getAdminModelId = (defaultModel = 'gemini-2.5-flash') => {
    const settings = getAiSettings();
    return settings.aiModel || defaultModel;
};

// --- Unified Config Resolver ---
export const resolveAIConfig = async () => {
    let provider = null;
    let apiKey = null;
    let model = null;

    // 1. Try User Settings
    try {
        const userSettings = await getUserSettings();
        if (userSettings && userSettings.aiApiKey) {
            provider = userSettings.aiProvider || 'google';
            apiKey = userSettings.aiApiKey;
            model = userSettings.aiModel || 'gemini-2.5-flash';
        }
    } catch (e) {
        console.warn("Could not fetch user settings, falling back.", e);
    }

    // 2. Fallback to Admin / Global
    if (!apiKey) {
        provider = getAdminProvider();
        apiKey = getAdminApiKey();
        model = getAdminModelId();
    }

    return { provider, apiKey, model };
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

// --- Helper: Retry Logic ---
const fetchWithRetry = async (url, options, retries = 3, backoff = 1000) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            // If server error (5xx), throw to trigger retry
            if (response.status >= 500) {
                throw new Error(`Server error: ${response.status}`);
            }
            // 429 Too Many Requests - also retry
            if (response.status === 429) {
                 throw new Error(`Rate limit exceeded: ${response.status}`);
            }
            return response; // 4xx errors are usually permanent (client error), return to handle
        }
        return response;
    } catch (err) {
        if (retries > 0) {
            console.warn(`Fetch failed, retrying in ${backoff}ms... (${retries} attempts left)`, err);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw err;
    }
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

    // Google SDK handles its own retries internally usually, but we wrap in try/catch
    try {
        const result = await client.models.generateContent({
            model: model,
            contents: { parts: [{ text: prompt }] },
            config: config,
        });
        return result.text;
    } catch (e) {
        console.error("Google AI generation failed:", e);
        if (e.message.includes('fetch')) {
             throw new Error("Network error connecting to Google AI. Please check your connection.");
        }
        throw new Error(`Google AI Error: ${e.message}`);
    }
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

    try {
        const response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
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
    } catch (error) {
        console.error("AI Provider generation failed:", error);
        if (error.message.includes('Failed to fetch')) {
             throw new Error("Network error: Could not reach the AI provider. Check your internet connection.");
        }
        throw error;
    }
};

// --- Main Exported Function ---

export const generateAIContent = async (prompt, schema, systemInstruction = "You are a helpful assistant.") => {
    const { provider, apiKey, model } = await resolveAIConfig();

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
        const res = await fetchWithRetry(url, { headers });
        if (!res.ok) throw new Error("Failed to fetch models");
        const data = await res.json();
        
        if (data.data) {
             return data.data.map(m => ({ id: m.id, name: m.name || m.id }));
        }
        return [];
    } catch (e) {
        // Fallbacks on error to prevent UI crash
        console.warn("Model fetch failed, using fallbacks:", e);
        if (provider === 'perplexity') return [{ id: 'sonar-pro', name: 'Sonar Pro' }, { id: 'sonar', name: 'Sonar' }];
        if (provider === 'openai') return [{ id: 'gpt-4o', name: 'GPT-4o' }, { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }, { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }];
        throw e;
    }
};

// --- Legacy / Specific Exports ---

export const isAnyModelConfigured = () => !!getAdminApiKey();
export const isModelConfigured = () => !!getAdminApiKey();

export const getProvider = getAdminProvider;
export const getApiKey = getAdminApiKey;
export const getModelId = getAdminModelId;

// --- Chat Session Helper ---

export const getGeminiClient = () => {
    const provider = getAdminProvider();
    if (provider !== 'google') return null;
    const apiKey = getAdminApiKey();
    return new GoogleGenAI({ apiKey });
};

// NEW: Async chat session creation that respects user settings
export const createChatSessionAsync = async () => {
    const config = await resolveAIConfig();
    
    if (config.provider === 'google' && config.apiKey) {
        const client = new GoogleGenAI({ apiKey: config.apiKey });
        const session = client.chats.create({ 
            model: config.model || 'gemini-2.5-flash',
            config: { systemInstruction: "You are an expert AI assistant." }
        });
        return {
            session,
            config,
            isGeneric: false
        };
    }
    
    return { 
        isGeneric: true,
        config
    }; 
};

// Deprecated Sync Version
export const createChatSession = () => {
    return { isGeneric: true }; 
};

export const sendChatMessage = async (chatContext, message, file, useWebSearch) => {
    const { session, config, isGeneric } = chatContext;
    
    if (!isGeneric && session && config.provider === 'google') {
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
            const client = new GoogleGenAI({ apiKey: config.apiKey });
            const result = await client.models.generateContent({
                model: config.model,
                contents: { parts: messageParts },
                config: { tools: [{ googleSearch: {} }] },
            });
            return { text: result.text, sources: result.candidates?.[0]?.groundingMetadata?.groundingChunks || [], isStream: false };
        } else {
            const stream = await session.sendMessageStream({ message: { parts: messageParts } });
            return { stream, isStream: true };
        }
    } 
    else {
        // Generic Provider Call
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

export const startVoiceSession = async (callbacks) => {
    const config = await resolveAIConfig();
    
    if (config.provider !== 'google') {
        throw new Error("Voice Chat is only available with Google Gemini provider.");
    }
    const client = new GoogleGenAI({ apiKey: config.apiKey });
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
