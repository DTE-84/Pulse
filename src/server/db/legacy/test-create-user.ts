import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testCreateUser() {
  const guestId = Math.random().toString(36).substring(7);
  const email = `test_guest_${guestId}@pulse.demo`;
  const password = "TestPassword123!";
  
  console.log(`[TEST] Creating user: ${email}`);
  
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: "Test Guest" }
    });
    
    if (error) {
      console.error("[TEST] Error:", JSON.stringify(error, null, 2));
    } else {
      console.log("[TEST] Success:", data.user.id);
      // Cleanup
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      console.log("[TEST] Cleaned up.");
    }
  } catch (err) {
    console.error("[TEST] Fatal:", err);
  } finally {
    process.exit(0);
  }
}

testCreateUser();
