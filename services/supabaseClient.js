import { createClient } from '@supabase/supabase-js';

// Helper to retrieve environment variables from various sources (Vite, Process, Window)
export const getEnv = (key) => {
    // 1. Check import.meta.env (Vite/Modern ESM)
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            if (import.meta.env[key]) return import.meta.env[key];
            if (import.meta.env[`VITE_${key}`]) return import.meta.env[`VITE_${key}`];
        }
    } catch (e) {}

    // 2. Check process.env (Node/Webpack/Browserify)
    try {
        if (typeof process !== 'undefined' && process.env) {
            if (process.env[key]) return process.env[key];
            if (process.env[`REACT_APP_${key}`]) return process.env[`REACT_APP_${key}`];
            if (process.env[`NEXT_PUBLIC_${key}`]) return process.env[`NEXT_PUBLIC_${key}`];
        }
    } catch (e) {}

    // 3. Check window/runtime injection (Legacy env.js or Docker entrypoint scripts)
    try {
        if (typeof window !== 'undefined' && window.process?.env) {
            // Direct match
            if (window.process.env[key]) return window.process.env[key];
            // Check for VITE_ prefix match in window.process.env
            if (window.process.env[`VITE_${key}`]) return window.process.env[`VITE_${key}`];
            
            // Check legacy _env_ object
            if (window._env_?.[key]) return window._env_[key];
        }
    } catch (e) {}

    return '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Helper to check if the value is a placeholder or valid
const isValidConfig = (value) => {
    return value && 
           value !== 'YOUR_SUPABASE_URL_HERE' && 
           value !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
           !value.startsWith('__VITE_'); // Check if it's still a placeholder
};

const isValidSupabaseConfig = () => isValidConfig(supabaseUrl) && isValidConfig(supabaseAnonKey);

// Explicitly enable session persistence in localStorage
export const supabase = isValidSupabaseConfig() 
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage
        }
    }) 
    : null;

// --- Auth Wrappers ---

export const signUp = async (email, password, fullName) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName }
        }
    });
    return { data, error };
};

export const signIn = async (email, password) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    return { data, error };
};

export const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    // Clear any local artifacts if needed
    if (supabaseUrl) {
        try {
            localStorage.removeItem('sb-' + (new URL(supabaseUrl).hostname.split('.')[0]) + '-auth-token'); 
        } catch(e) {}
    }
    return { error };
};

export const getCurrentUser = async () => {
    if (!supabase) return null;
    
    try {
        // 1. Get Session (Fast, Local)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
            return null;
        }
        
        // 2. Return User structure immediately from session
        return {
            id: session.user.id,
            email: session.user.email,
            fullName: session.user.user_metadata?.full_name || 'User',
            ...session.user
        };
    } catch (e) {
        console.warn("Error getting current user:", e);
        return null;
    }
};

// --- User Settings (AI Configuration) ---

export const getUserSettings = async () => {
    if (!supabase) return null;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;

        const { data, error } = await supabase
            .from('user_settings')
            .select('settings')
            .eq('user_id', session.user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found", which is fine
            console.error("Error fetching user settings:", error);
        }
        return data?.settings || null;
    } catch (e) {
        console.warn("Error in getUserSettings:", e);
        return null;
    }
};

export const saveUserSettings = async (settings) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("User not authenticated");

    const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: session.user.id, settings: settings });

    if (error) throw error;
};


// --- Project Data Wrappers ---

export const getUserProjects = async () => {
    if (!supabase) return [];
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return [];

        const { data, error } = await supabase
            .from('projects')
            .select('id, title, objective, created_at, updated_at')
            .eq('user_id', session.user.id)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error("Error fetching projects:", error);
            return [];
        }
        return data || [];
    } catch (e) {
        console.error("Exception fetching projects:", e);
        return [];
    }
};

export const getProjectDetails = async (projectId) => {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (error) {
        console.error("Error fetching project details:", error);
        throw error;
    }
    return data;
};

export const saveProject = async (projectId, projectData) => {
    if (!supabase) throw new Error("Supabase not configured");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("User not authenticated");

    const payload = {
        user_id: session.user.id,
        title: projectData.consultingPlan?.projectTitle || projectData.objective?.substring(0, 50) || "Untitled Project",
        objective: projectData.objective,
        plan: projectData.plan,
        schedule: projectData.schedule,
        risks: projectData.risk,
        budget: projectData.budget,
        structure: projectData.structure,
        kpis: projectData.kpiReport,
        s_curve: projectData.sCurveReport,
        consulting_plan: projectData.consultingPlan,
        agents: projectData.agents,
        updated_at: new Date().toISOString()
    };

    let result;
    if (projectId) {
        // Update
        result = await supabase
            .from('projects')
            .update(payload)
            .eq('id', projectId)
            .select()
            .single();
    } else {
        // Insert
        result = await supabase
            .from('projects')
            .insert([payload])
            .select()
            .single();
    }

    if (result.error) throw result.error;
    return result.data;
};

export const deleteProject = async (projectId) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("User not authenticated");

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', session.user.id);

    if (error) throw error;
    return true;
};

export const updateProjectTitle = async (projectId, newTitle) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("User not authenticated");

    const { error } = await supabase
        .from('projects')
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .eq('user_id', session.user.id);

    if (error) throw error;
    return true;
};

export const saveChatMessage = async (serviceId, messageData) => {
    if (!supabase) return;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        await supabase.from('chat_history').insert([{
            user_id: session.user.id,
            service_id: serviceId,
            user_message: messageData.user,
            model_response: messageData.model,
            sources: messageData.sources,
            file_name: messageData.file
        }]);
    } catch (e) {
        console.warn("Failed to save chat message", e);
    }
};

export const getChatHistory = async (serviceId) => {
    if (!supabase) return [];
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return [];

        const { data, error } = await supabase
            .from('chat_history')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('service_id', serviceId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) return [];
        
        return data.map(item => ({
            id: item.id,
            user: item.user_message,
            model: item.model_response,
            file: item.file_name,
            sources: item.sources,
            timestamp: item.created_at
        }));
    } catch (e) {
        console.warn("Failed to fetch history", e);
        return [];
    }
};
