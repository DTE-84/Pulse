import { Request, Response } from "express";
import { 
  Configuration, 
  PlaidApi, 
  PlaidEnvironments, 
  Products, 
  CountryCode 
} from "plaid";
import { query } from "../db/db";

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

export const createLinkToken = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Authentication required." });

  try {
    const response = await client.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "Pulse Ai",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
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
      `INSERT INTO public.plaid_items (user_id, plaid_item_id, institution_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (plaid_item_id) DO UPDATE SET status = 'active', updated_at = NOW()
       RETURNING item_id`,
      [userId, item_id, institutionName]
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
