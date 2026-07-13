import "dotenv/config";
import { query } from "../src/server/db/db.js";

const HR_WEBHOOK_SECRET = process.env.HR_WEBHOOK_SECRET || "dev_hr_secret_12345";
const API_URL = "http://localhost:8080/api/webhooks/hr";

async function run() {
  console.log("=== HR WEBHOOK SIMULATION ===");

  // We need an email that exists in the local DB. We will pick a demo user or sandbox user.
  const email = "sandbox@pulse.demo"; 
  
  // Verify user exists locally
  const res = await query("SELECT user_id, subscription_status FROM dim_users WHERE email = $1", [email]);
  if (res.rows.length === 0) {
    console.warn(`User ${email} not found in DB. Test will just return 200 without modifying DB.`);
  } else {
    console.log(`Target User ID: ${res.rows[0].user_id}, Current Status: ${res.rows[0].subscription_status}`);
  }

  const payload = {
    eventType: "employee.terminated",
    email: email
  };

  console.log(`\nDispatching payload:`, payload);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${HR_WEBHOOK_SECRET}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log(`Response Status: ${response.status}`);
    console.log(`Response Body:`, data);

    if (res.rows.length > 0) {
      // Check if status changed
      const updated = await query("SELECT subscription_status FROM dim_users WHERE email = $1", [email]);
      console.log(`\nVerification: New Status is [${updated.rows[0].subscription_status}]`);
    }

  } catch (err: any) {
    console.error("Error calling webhook:", err);
  }
}

run().catch(console.error).finally(() => process.exit(0));
