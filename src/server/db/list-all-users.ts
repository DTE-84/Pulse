import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function listAllUsers() {
  console.log("[DIAGNOSTIC] Listing all users in Supabase Auth...");
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error("[DIAGNOSTIC] Error:", JSON.stringify(error, null, 2));
    } else {
      console.log(`[DIAGNOSTIC] Found ${data.users.length} users.`);
      data.users.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}, Confirmed: ${!!user.email_confirmed_at}`);
      });
    }
  } catch (err) {
    console.error("[DIAGNOSTIC] Fatal:", err);
  } finally {
    process.exit(0);
  }
}

listAllUsers();
