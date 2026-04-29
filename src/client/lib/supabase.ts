import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[PulseAi] Missing Supabase environment variables.\n" +
      "Add the following to your .env file:\n" +
      "  VITE_SUPABASE_URL=https://<your-project>.supabase.co\n" +
      "  VITE_SUPABASE_ANON_KEY=<your-anon-key>\n" +
      "Find these values in your Supabase dashboard under Project Settings → API.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
