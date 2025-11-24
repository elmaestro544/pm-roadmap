
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = window.process?.env?.SUPABASE_URL;
const supabaseAnonKey = window.process?.env?.SUPABASE_ANON_KEY;

const isValidSupabaseConfig = () => 
    supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL_HERE' && 
    supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY_HERE';

// Explicitly enable session persistence in localStorage
export const supabase = isValidSupabaseConfig() 
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
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
    return { error };
};

export const getCurrentUser = async () => {
    if (!supabase) return null;
    
    // Check for existing session first
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) return null;
    
    // Enrich with user metadata
    return {
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.user_metadata?.full_name || 'User',
        ...session.user
    };
};

// --- User Settings (AI Configuration) ---

export const getUserSettings = async () => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found", which is fine
        console.error("Error fetching user settings:", error);
    }
    return data?.settings || null;
};

export const saveUserSettings = async (settings) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, settings: settings });

    if (error) throw error;
};


// --- Project Data Wrappers ---

/**
 * Fetches all projects for the current user.
 */
export const getUserProjects = async () => {
    if (!supabase) return [];
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('projects')
        .select('id, title, objective, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error("Error fetching projects:", error);
        return [];
    }
    return data;
};

/**
 * Fetches full data for a single project.
 */
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

/**
 * Saves or Updates a project.
 * @param {string} projectId - Optional ID. If provided, updates existing. If null, creates new.
 * @param {object} projectData - The data to save.
 */
export const saveProject = async (projectId, projectData) => {
    if (!supabase) throw new Error("Supabase not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const payload = {
        user_id: user.id,
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

/**
 * Saves a chat message to history
 */
export const saveChatMessage = async (serviceId, messageData) => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('chat_history').insert([{
        user_id: user.id,
        service_id: serviceId,
        user_message: messageData.user,
        model_response: messageData.model,
        sources: messageData.sources,
        file_name: messageData.file
    }]);
};

/**
 * Fetch chat history
 */
export const getChatHistory = async (serviceId) => {
    if (!supabase) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) return [];
    
    // Map to app format
    return data.map(item => ({
        id: item.id,
        user: item.user_message,
        model: item.model_response,
        file: item.file_name,
        sources: item.sources,
        timestamp: item.created_at
    }));
};
