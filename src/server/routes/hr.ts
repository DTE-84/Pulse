import { Request, Response } from "express";
import { query } from "../db/db.js";
import { getSupabaseAdmin } from "../middleware/security.js";

const HR_WEBHOOK_SECRET = process.env.HR_WEBHOOK_SECRET || "dev_hr_secret_12345";

export const handleHrWebhook = async (req: Request, res: Response) => {
  // 1. Authenticate the Webhook
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }
  
  const token = authHeader.split(" ")[1];
  if (token !== HR_WEBHOOK_SECRET) {
    return res.status(403).json({ message: "Invalid webhook secret." });
  }

  const { eventType, email, newTier } = req.body;

  if (!eventType || !email) {
    return res.status(400).json({ message: "Missing required fields: eventType, email." });
  }

  console.log(`[HR WEBHOOK] Received event: ${eventType} for ${email}`);

  try {
    // 2. Resolve user by email
    const userResult = await query("SELECT user_id FROM dim_users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      console.warn(`[HR WEBHOOK] User not found in system: ${email}`);
      return res.status(200).json({ message: "User not found, ignoring event." });
    }
    const userId = userResult.rows[0].user_id;
    const supabaseAdmin = getSupabaseAdmin();

    if (eventType === "employee.terminated") {
      // Step A: Terminate Supabase Auth Session (Prevents further logins)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        console.error(`[HR WEBHOOK] Failed to delete Supabase identity for ${userId}:`, authError.message);
        // We continue to wipe local data even if Supabase deletion fails
      } else {
        console.log(`[HR WEBHOOK] Supabase identity revoked for ${userId}`);
      }

      // Step B: Update Local Database Status
      await query(
        "UPDATE dim_users SET subscription_status = 'terminated', updated_at = NOW() WHERE user_id = $1",
        [userId]
      );

      // Step C: Wipe Plaid Secrets to stop data ingestion
      // We join through plaid_items to find the secret
      await query(
        `DELETE FROM plaid_secrets WHERE item_id IN (SELECT item_id FROM plaid_items WHERE user_id = $1)`,
        [userId]
      );

      console.log(`[HR WEBHOOK] De-provisioning complete for ${email}`);
      
    } else if (eventType === "employee.transferred") {
      // Handle role/tier adjustments
      if (newTier) {
        await query(
          "UPDATE dim_users SET subscription_tier = $1, updated_at = NOW() WHERE user_id = $2",
          [newTier, userId]
        );
        console.log(`[HR WEBHOOK] Access tier updated to ${newTier} for ${email}`);
      }
    } else {
      console.log(`[HR WEBHOOK] Unhandled eventType: ${eventType}`);
    }

    return res.status(200).json({ received: true, status: "processed" });
  } catch (err: any) {
    console.error("[HR WEBHOOK] Processing Error:", err.message);
    return res.status(500).json({ message: "Internal processing error." });
  }
};
