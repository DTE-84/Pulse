import { query } from "./db.js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testWithoutTrigger() {
  try {
    console.log("[TEST] Disabling trigger...");
    await query("ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created");
    
    const guestId = Math.random().toString(36).substring(7);
    const email = `no_trigger_${guestId}@pulse.demo`;
    
    console.log(`[TEST] Creating user without trigger: ${email}`);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "TestPassword123!",
      email_confirm: true
    });
    
    if (error) {
      console.error("[TEST] Error (still failing):", JSON.stringify(error, null, 2));
    } else {
      console.log("[TEST] Success without trigger!", data.user.id);
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    }
    
  } catch (err) {
    console.error("[TEST] SQL Error:", err.message);
  } finally {
    console.log("[TEST] Re-enabling trigger...");
    await query("ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created");
    process.exit(0);
  }
}

testWithoutTrigger();
