import { describe, it, expect } from 'vitest';
import { Configuration, PlaidApi, PlaidEnvironments, Products } from 'plaid';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

describe('Plaid Sandbox Direct Token Injection', () => {
  it('should create a public token using custom mock data to bypass Link UI', async () => {
    // Custom mock data to inject into the sandbox session
    const mockData = {
      override_accounts: [
        {
          starting_balance: 1000.00,
          type: 'depository',
          subtype: 'checking',
          meta: {
            name: 'Nova Nexus Checking',
            number: '111122223333'
          }
        }
      ]
    };

    try {
      const response = await plaidClient.sandboxPublicTokenCreate({
        institution_id: 'ins_109508', // First Platypus Bank
        initial_products: [Products.Auth, Products.Transactions],
        options: {
          override_username: 'user_custom', // Required for custom data injection
          override_password: JSON.stringify(mockData)
        }
      });

      expect(response.data.public_token).toBeDefined();
      expect(response.data.public_token).toMatch(/^public-sandbox-/);
      
      console.log('✅ Success: Programmatic Public Token generated:', response.data.public_token);
      console.log('🔗 You can now exchange this for an access_token in your backend tests.');
    } catch (err: any) {
      console.error('❌ Plaid Sandbox Error:', err.response?.data || err.message);
      throw err;
    }
  }, 10000); // Higher timeout for network requests
});
