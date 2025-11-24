// This file is for environment variable configuration.
// In a real deployment, these values would be set by the server or build environment.

window.process = window.process || {};
window.process.env = {
  ...window.process.env,

  // --- Google Gemini ---
  // Get your key from: https://aistudio.google.com/app/apikey
  API_KEY: 'AIzaSyDlJEVMudhun7nbZkVHxm5yxbGlabDxRCI',

  // --- Supabase Configuration ---
  // 1. Go to Supabase Dashboard -> Project Settings -> API
  // 2. Copy "Project URL" to SUPABASE_URL
  // 3. Copy "anon public" key to SUPABASE_ANON_KEY
  // WARNING: Do NOT use your database password or service_role key here.
  // The 'anon' key is safe to be exposed in the browser for Row Level Security (RLS).
  SUPABASE_URL: 'https://hrnpullcpqbvefzzsanh.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybnB1bGxjcHFidmVmenpzYW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDE2OTUsImV4cCI6MjA3OTQ3NzY5NX0.HgnnGfqKn5tUGq7EgRrZ3m4oEiSJmba9LODCjp8Y8-Q',
  
};