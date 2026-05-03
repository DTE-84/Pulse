import { query } from "../src/server/db/db";

export default async function (req: any, res: any) {
  const health: any = { 
    status: "running", 
    env: { 
      node_env: process.env.NODE_ENV,
      has_db: !!process.env.DATABASE_URL,
      has_ai: !!process.env.GOOGLE_GENAI_API_KEY
    },
    checks: {} 
  };
  try {
    await query("SELECT 1");
    health.checks.database = "connected";
  } catch (e: any) {
    health.checks.database = "error: " + e.message;
    health.status = "degraded";
  }
  res.json(health);
}
