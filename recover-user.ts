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

async function recoverUser(email: string) {
  console.log(`[RECOVERY] Attempting to recover user: ${email}`);
  const newPassword = "RecoveryPassword123!"; // Temporary password
  
  try {
    // 1. Find user
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      console.error(`[RECOVERY] User not found: ${email}`);
      return;
    }
    
    console.log(`[RECOVERY] User ID: ${user.id}`);
    
    // 2. Update user: Set password and confirm email
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      email_confirm: true
    });
    
    if (error) {
      console.error("[RECOVERY] Error updating user:", JSON.stringify(error, null, 2));
    } else {
      console.log(`[RECOVERY] SUCCESS!`);
      console.log(`[RECOVERY] Email: ${email}`);
      console.log(`[RECOVERY] Temporary Password: ${newPassword}`);
      console.log(`[RECOVERY] Email has been marked as confirmed.`);
    }
  } catch (err) {
    console.error("[RECOVERY] Fatal:", err);
  } finally {
    process.exit(0);
  }
}

const targetEmail = process.argv[2];
if (!targetEmail) {
  console.log("Usage: npx tsx recover-user.ts <email>");
  process.exit(1);
}

recoverUser(targetEmail);
