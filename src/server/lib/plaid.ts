import { 
  Configuration, 
  PlaidApi, 
  PlaidEnvironments 
} from "plaid";
import crypto from "crypto";
import { query } from "../db/db.js";

// 1. Plaid Credential Guard
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;

if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
  console.warn("[PULSE PLAID] WARNING: PLAID credentials missing — bank linking will be disabled.");
}

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
      "PLAID-SECRET": PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// 2. High-Fidelity Token Encryption
const ENCRYPTION_KEY = process.env.PLAID_ENCRYPTION_KEY || ""; // Must be 32 chars
const IV_LENGTH = 16; 

export function encryptAccessToken(token: string) {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
    console.error("[PULSE SECURITY] PLAID_ENCRYPTION_KEY missing or invalid. Storing in PLAINTEXT.");
    return token;
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(token);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

/**
 * Silent Provisioning: Setup Trial Sandbox Item
 * Engineered to eliminate friction for new trial users by pre-linking a sandbox Chase account.
 */
export async function setupTrialSandboxItem(userId: string) {
  // 3. Production Guard: Prevent sandbox-only calls in live environment
  if (process.env.PLAID_ENV === "production") {
    console.warn("[PULSE PLAID] Sandbox provisioning skipped in production node.");
    return { success: false, itemId: null };
  }

  console.log(`[PULSE PLAID] Initializing silent provisioning for user: ${userId}`);
  
  try {
    // 1. Create a public token for a sandbox institution (Chase)
    console.log("[PULSE PLAID] Creating sandbox public token...");
    const sandboxResponse = await plaidClient.sandboxPublicTokenCreate({
      institution_id: "ins_109508",
      initial_products: ["transactions" as any],
      options: {
        override_username: "user_good",
        override_password: "password_good",
      },
    });

    const publicToken = sandboxResponse.data.public_token;

    // 2. Exchange for access token
    console.log("[PULSE PLAID] Exchanging public token for access token...");
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const { access_token, item_id } = exchangeResponse.data;

    // 3. Persist Plaid Item
    console.log(`[PULSE PLAID] Persisting item ${item_id} to database...`);
    const itemResult = await query(
      `INSERT INTO public.plaid_items (user_id, plaid_item_id, institution_name, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (plaid_item_id) DO UPDATE SET status = 'active', updated_at = NOW()
       RETURNING item_id`,
      [userId, item_id, "Chase Sandbox", "active"]
    );

    const internalItemId = itemResult.rows[0].item_id;

    // 4. Persist Plaid Secret (High-Fidelity Encryption)
    console.log("[PULSE PLAID] Encrypting and persisting access token...");
    const encryptedToken = encryptAccessToken(access_token);
    await query(
      `INSERT INTO public.plaid_secrets (item_id, access_token_encrypted)
       VALUES ($1, $2)
       ON CONFLICT (item_id) DO UPDATE SET access_token_encrypted = EXCLUDED.access_token_encrypted`,
      [internalItemId, encryptedToken]
    );

    // 5. Fire Sandbox Webhook (Simulate Live Transaction Flow)
    if (process.env.PLAID_ENV === "sandbox" || !process.env.PLAID_ENV) {
      console.log(`[PULSE PLAID] Firing synthetic transaction webhook for sandbox item: ${item_id}`);
      try {
        await plaidClient.sandboxItemFireWebhook({
          access_token: access_token,
          webhook_type: "TRANSACTIONS" as any,
          webhook_code: "DEFAULT_UPDATE" as any,
        });
      } catch (webhookErr: any) {
        console.warn("[PULSE PLAID] Sandbox webhook firing failed (ignoring):", webhookErr.message);
      }
    }

    console.log(`[PULSE PLAID] Trial sandbox item provisioned successfully: ${item_id}`);
    return { success: true, itemId: item_id };
  } catch (err: any) {
    const detail = err.response?.data || err.message;
    console.error("[PULSE PLAID] Trial Seeding Failed:", detail);
    throw new Error(`Plaid Provisioning Error: ${JSON.stringify(detail)}`);
  }
}
