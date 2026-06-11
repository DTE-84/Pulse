import { Request, Response } from "express";
import { 
  Products, 
  CountryCode 
} from "plaid";
import { query } from "../db/db.js";
import { plaidClient as client, encryptAccessToken } from "../lib/plaid.js";

export const createLinkToken = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Authentication required." });

  try {
    // 1. Unified Subscription Guard (Deterministic Check)
    const userRes = await query(
      "SELECT subscription_status, trial_ends_at FROM dim_users WHERE user_id = $1", 
      [userId]
    );
    const user = userRes.rows[0];

    const hasActiveSub = user?.subscription_status === 'active' || 
                         (user?.subscription_status === 'trialing' && new Date(user.trial_ends_at) > new Date());

    if (!hasActiveSub) {
      return res.status(403).json({ 
        message: "Elite Uplink Required", 
        detail: "Real-world bank synchronization requires an active subscription or trial. Please upgrade to continue." 
      });
    }

    const response = await client.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: process.env.PLAID_CLIENT_NAME || "Pulse Ai",
      products: (process.env.PLAID_PRODUCTS || "transactions").split(",") as Products[],
      country_codes: (process.env.PLAID_COUNTRY_CODES || "US").split(",") as CountryCode[],
      language: "en",
      redirect_uri: process.env.PLAID_REDIRECT_URI || undefined,
    });
    res.json(response.data);
  } catch (err: any) {
    console.error("[Plaid] Link Token Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Could not initialize bank linkage." });
  }
};

export const exchangePublicToken = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Authentication required." });

  const { publicToken, institutionName } = req.body;

  try {
    // 2. Map Trial Status to Item Metadata
    const userRes = await query("SELECT subscription_status FROM dim_users WHERE user_id = $1", [userId]);
    const isTrial = userRes.rows[0]?.subscription_status === 'trialing';

    const response = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const { access_token, item_id } = response.data;

    // 3. Persist Plaid Item (Metadata - RLS Safe)
    const itemResult = await query(
      `INSERT INTO public.plaid_items (user_id, plaid_item_id, institution_name, environment, is_trial_item)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (plaid_item_id) DO UPDATE SET status = 'active', updated_at = NOW()
       RETURNING item_id`,
      [userId, item_id, institutionName, process.env.PLAID_ENV || "sandbox", isTrial]
    );

    const internalItemId = itemResult.rows[0].item_id;

    // 4. Persist Plaid Secret (High-Fidelity Centralized Encryption)
    const encryptedToken = encryptAccessToken(access_token);
    
    await query(
      `INSERT INTO public.plaid_secrets (item_id, access_token_encrypted)
       VALUES ($1, $2)
       ON CONFLICT (item_id) DO UPDATE SET access_token_encrypted = EXCLUDED.access_token_encrypted`,
      [internalItemId, encryptedToken]
    );

    res.json({ message: "Bank successfully linked to Pulse telemetry." });
  } catch (err: any) {
    console.error("[Plaid] Exchange Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Could not established analytical link to bank." });
  }
};
