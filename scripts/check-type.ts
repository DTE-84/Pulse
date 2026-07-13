import "dotenv/config";
import { query } from "../src/server/db/db.js";

async function check() {
  const res = await query("SELECT data_type FROM information_schema.columns WHERE table_name = 'dim_users' AND column_name = 'user_id'");
  console.log(res.rows);
}
check().catch(console.error).finally(() => process.exit(0));
