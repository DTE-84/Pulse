import { query } from "./db.js";

async function finalizeTrigger() {
  try {
    console.log("[PULSE DIAGNOSTIC] Finalizing robust handle_new_user trigger...");
    
    // We use COALESCE and EXCLUDED to ensure data integrity during sync or guest creation.
    // We let the DB handle defaults for subscription_status, trial_ends_at, etc. to reduce trigger complexity.
    await query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user() 
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.dim_users (
          user_id, 
          email, 
          user_name,
          onboarding_completed,
          is_demo
        )
        VALUES (
          new.id, 
          new.email, 
          COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'New User'),
          COALESCE((new.raw_user_meta_data->>'onboarding_completed')::boolean, false),
          COALESCE((new.raw_user_meta_data->>'is_demo')::boolean, false)
        )
        ON CONFLICT (user_id) DO UPDATE SET
          email = EXCLUDED.email,
          user_name = COALESCE(EXCLUDED.user_name, public.dim_users.user_name),
          onboarding_completed = COALESCE(EXCLUDED.onboarding_completed, public.dim_users.onboarding_completed),
          is_demo = COALESCE(EXCLUDED.is_demo, public.dim_users.is_demo);
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    console.log("[PULSE DIAGNOSTIC] Robust trigger deployed.");
  } catch (err) {
    console.error("[PULSE DIAGNOSTIC] Finalization failed:", err.message);
  } finally {
    process.exit(0);
  }
}

finalizeTrigger();
