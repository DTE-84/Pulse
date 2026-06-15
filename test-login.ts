import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin(email: string, pass: string) {
  console.log(`[TEST] Attempting login for: ${email}`);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });
    
    if (error) {
      console.error("[TEST] Login Failed:", error.message);
    } else {
      console.log("[TEST] Login Success!");
      console.log("[TEST] User ID:", data.user?.id);
    }
  } catch (err) {
    console.error("[TEST] Fatal:", err);
  } finally {
    process.exit(0);
  }
}

const email = process.argv[2];
const pass = process.argv[3];

if (!email || !pass) {
  console.log("Usage: npx tsx test-login.ts <email> <password>");
  process.exit(1);
}

testLogin(email, pass);
