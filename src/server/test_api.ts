import "dotenv/config";
import jwt from "jsonwebtoken";
import { query } from "./db/db.js";

async function run() {
  try {
    const secret = process.env.JWT_SECRET;
    const userRes = await query("SELECT user_id, email FROM dim_users LIMIT 1");
    if (userRes.rows.length === 0) {
      console.log("No users found");
      process.exit(1);
    }
    const user = userRes.rows[0];
    
    const token = jwt.sign({ id: user.user_id, email: user.email }, secret!, { expiresIn: '1h' });
    
    console.log("Fetching http://localhost:3000/api/stats...");
    const res = await fetch("http://localhost:3000/api/stats", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
    
    console.log("\nFetching http://localhost:3000/api/plaid/sandbox-seed...");
    const res2 = await fetch("http://localhost:3000/api/plaid/sandbox-seed", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    const text2 = await res2.text();
    console.log("Status:", res2.status);
    console.log("Body:", text2);

  } catch (e) {
    console.error("error:", e);
  }
  process.exit(0);
}
run();
