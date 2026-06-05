import { query } from "./db.js";

async function refineTrigger() {
  try {
    console.log("[PULSE DIAGNOSTIC] Refining handle_new_user trigger...");
    
    await query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user() 
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.dim_users (user_id, email, user_name)
        VALUES (
          new.id, 
          new.email, 
          COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'New User')
        )
        ON CONFLICT (user_id) DO UPDATE SET
          email = EXCLUDED.email,
          user_name = COALESCE(EXCLUDED.user_name, public.dim_users.user_name);
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    console.log("[PULSE DIAGNOSTIC] Trigger refined. Run test-simple-create.ts now.");
  } catch (err) {
    console.error("[PULSE DIAGNOSTIC] Refinement failed:", err.message);
  } finally {
    process.exit(0);
  }
}

refineTrigger();
