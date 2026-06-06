import { 
  Configuration, 
  PlaidApi, 
  PlaidEnvironments 
} from "plaid";
import { query } from "../db/db.js";

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

/**
 * Silent Provisioning: Setup Trial Sandbox Item
 * Engineered to eliminate friction for new trial users by pre-linking a sandbox Chase account.
 */
export async function setupTrialSandboxItem(userId: string) {
  console.log(`[PULSE PLAID] Initializing silent provisioning for user: ${userId}`);
  
  try {
    // 1. Create a public token for a sandbox institution (Chase)
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
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const { access_token, item_id } = exchangeResponse.data;

    // 3. Persist Plaid Item with 'environment' and 'isTrialItem' flags
    const itemResult = await query(
      `INSERT INTO public.plaid_items (user_id, plaid_item_id, institution_name, environment, is_trial_item)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (plaid_item_id) DO UPDATE SET status = 'active', updated_at = NOW()
       RETURNING item_id`,
      [userId, item_id, "Chase Sandbox", process.env.PLAID_ENV || "sandbox", true]
    );

    const internalItemId = itemResult.rows[0].item_id;

    // 4. Persist Plaid Secret (Encrypted - Placeholder for Encryption Logic)
    await query(
      `INSERT INTO public.plaid_secrets (item_id, access_token_encrypted)
       VALUES ($1, $2)
       ON CONFLICT (item_id) DO UPDATE SET access_token_encrypted = EXCLUDED.access_token_encrypted`,
      [internalItemId, access_token]
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
    console.error("[PULSE PLAID] Trial Seeding Failed:", err.response?.data || err.message);
    throw err;
  }
}
