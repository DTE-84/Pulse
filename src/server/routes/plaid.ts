import { Request, Response } from "express";
import { 
  Products, 
  CountryCode 
} from "plaid";
import { query } from "../db/db.js";
import { plaidClient as client } from "../lib/plaid.js";

export const createLinkToken = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Authentication required." });

  try {
    // Subscription Guard: Only block if subscription has explicitly expired
    const userRes = await query("SELECT subscription_status FROM dim_users WHERE user_id = $1", [userId]);
    const user = userRes.rows[0];

    if (!user || user.subscription_status === 'expired') {
      return res.status(403).json({ 
        message: "Elite Uplink Required", 
        detail: "Real-world bank synchronization requires an active subscription. Please upgrade to continue." 
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
  const { publicToken, institutionName } = req.body;
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Authentication required." });

  try {
    const response = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const { access_token, item_id } = response.data;

    // 1. Persist Plaid Item (Metadata - RLS Safe)
    const itemResult = await query(
      `INSERT INTO public.plaid_items (user_id, plaid_item_id, institution_name, environment, is_trial_item)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (plaid_item_id) DO UPDATE SET status = 'active', updated_at = NOW()
       RETURNING item_id`,
      [userId, item_id, institutionName, process.env.PLAID_ENV || "sandbox", false]
    );

    const internalItemId = itemResult.rows[0].item_id;

    // 2. Persist Plaid Secret (Encrypted - Placeholder for Encryption Logic)
    // In production, access_token should be encrypted before storage.
    await query(
      `INSERT INTO public.plaid_secrets (item_id, access_token_encrypted)
       VALUES ($1, $2)
       ON CONFLICT (item_id) DO UPDATE SET access_token_encrypted = EXCLUDED.access_token_encrypted`,
      [internalItemId, access_token]
    );

    res.json({ message: "Bank successfully linked to Pulse telemetry." });
  } catch (err: any) {
    console.error("[Plaid] Exchange Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Could not established analytical link to bank." });
  }
};
