
// This file is configured for runtime environment variable injection.
// In Coolify/Docker, use a Post-Deployment command to replace the placeholders.
// Example: sed -i "s|__VITE_API_KEY__|$VITE_API_KEY|g" env.js

window.process = window.process || {};
window.process.env = window.process.env || {};

// --- API Keys & Configuration ---

// Maps standard keys to the placeholders
// The user's sed command replaces __VITE_API_KEY__
window.process.env.API_KEY = '__VITE_API_KEY__';
window.process.env.SUPABASE_URL = '__VITE_SUPABASE_URL__';
window.process.env.SUPABASE_ANON_KEY = '__VITE_SUPABASE_ANON_KEY__';

// Maps VITE_ prefixed keys to the same placeholders (for compatibility)
window.process.env.VITE_API_KEY = '__VITE_API_KEY__';
window.process.env.VITE_SUPABASE_URL = '__VITE_SUPABASE_URL__';
window.process.env.VITE_SUPABASE_ANON_KEY = '__VITE_SUPABASE_ANON_KEY__';
