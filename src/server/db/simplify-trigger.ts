import { query } from "./db.js";

async function simplifyTrigger() {
  try {
    console.log("[PULSE DIAGNOSTIC] Simplifying handle_new_user trigger...");
    
    await query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user() 
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.dim_users (user_id, email, user_name)
        VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', 'New User'))
        ON CONFLICT (user_id) DO UPDATE SET
          email = EXCLUDED.email;
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    console.log("[PULSE DIAGNOSTIC] Trigger simplified. Run test-simple-create.ts now.");
  } catch (err) {
    console.error("[PULSE DIAGNOSTIC] Simplification failed:", err.message);
  } finally {
    process.exit(0);
  }
}

simplifyTrigger();
