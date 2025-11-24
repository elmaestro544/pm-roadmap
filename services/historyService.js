
import * as supabaseClient from './supabaseClient.js';

// Fallback to local storage if Supabase is not configured
const HISTORY_KEY = 'pmroadmap_history';

const getFullLocalHistory = () => {
    try {
        const history = localStorage.getItem(HISTORY_KEY);
        return history ? JSON.parse(history) : {};
    } catch (e) {
        return {};
    }
};

export const getHistory = async (userEmail, serviceId) => {
    // Try Supabase first
    if (supabaseClient.supabase) {
        return await supabaseClient.getChatHistory(serviceId);
    }

    // Fallback
    if (!userEmail) return [];
    const fullHistory = getFullLocalHistory();
    return fullHistory[userEmail]?.[serviceId] || [];
};

export const addHistoryItem = async (userEmail, serviceId, item) => {
    // Try Supabase first
    if (supabaseClient.supabase) {
        await supabaseClient.saveChatMessage(serviceId, item);
        return;
    }

    // Fallback
    if (!userEmail) return;
    const fullHistory = getFullLocalHistory();
    
    if (!fullHistory[userEmail]) {
        fullHistory[userEmail] = {};
    }
    if (!fullHistory[userEmail][serviceId]) {
        fullHistory[userEmail][serviceId] = [];
    }
    
    const newItem = { ...item, id: Date.now(), timestamp: new Date().toISOString() };
    fullHistory[userEmail][serviceId].unshift(newItem);
    
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(fullHistory));
    } catch (e) {
        console.error("Local storage error", e);
    }
};

export const clearHistory = (userEmail, serviceId) => {
    // Supabase deletion not implemented in this snippet to keep it simple,
    // usually users just want to clear local view or we add a delete endpoint.
    // For now, only clearing local fallback.
    if (!userEmail) return;
    const fullHistory = getFullLocalHistory();
    if (fullHistory[userEmail]?.[serviceId]) {
        fullHistory[userEmail][serviceId] = [];
        localStorage.setItem(HISTORY_KEY, JSON.stringify(fullHistory));
    }
    return []; 
};
