import { createClient } from "@supabase/supabase-js";

// PRODUCTION DEBUG: Explicit credentials to bypass Vercel environment loading failures
const supabaseUrl = "https://uxgjcgfdfnmiixlkisjd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4Z2pjZ2ZkZm5taWl4bGtpc2pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTI5OTgsImV4cCI6MjA4OTY4ODk5OH0.zLvtZt0CF47YFBX9srq-YiCvx9LWSXa5W0xRSOGxUXE";

console.log("[PulseAi] Supabase initialized with static production credentials.");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
