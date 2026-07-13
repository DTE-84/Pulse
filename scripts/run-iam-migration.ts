import "dotenv/config";
import { query } from "../src/server/db/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  console.log("Running IAM migration...");
  try {
    const sql = fs.readFileSync(path.join(__dirname, "../sql/iam_migration.sql"), "utf-8");
    await query(sql);
    console.log("Migration successful!");
  } catch (err: any) {
    console.error("Migration failed:", err.message);
  } finally {
    process.exit(0);
  }
}

runMigration();
