import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function testListUsers() {
  console.log("[TEST] Attempting to list users with Admin client...");
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });
    
    if (error) {
      console.error("[TEST] Error:", JSON.stringify(error, null, 2));
    } else {
      console.log("[TEST] Success! Found users:", data.users.length);
    }
  } catch (err) {
    console.error("[TEST] Fatal:", err);
  } finally {
    process.exit(0);
  }
}

testListUsers();
