import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function testSimpleCreate() {
  const email = `simple_test_${Math.random().toString(36).substring(7)}@test.com`;
  console.log(`[TEST] Creating simple user: ${email}`);
  
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "Password123!",
      email_confirm: true
    });
    
    if (error) {
      console.error("[TEST] Error:", JSON.stringify(error, null, 2));
    } else {
      console.log("[TEST] Success:", data.user.id);
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    }
  } catch (err) {
    console.error("[TEST] Fatal:", err);
  } finally {
    process.exit(0);
  }
}

testSimpleCreate();
