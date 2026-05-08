import { query } from "./db";

async function listUsers() {
  try {
    const res = await query("SELECT user_id, user_name, email FROM dim_users");
    console.log("--- Pulse Users ---");
    res.rows.forEach(u => console.log(`ID: ${u.user_id} | Name: ${u.user_name} | Email: ${u.email}`));
  } catch (err) {
    console.error("Failed to list users:", err);
  } finally {
    process.exit();
  }
}

listUsers();
