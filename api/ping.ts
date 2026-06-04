import type { VercelRequest, VercelResponse } from '@vercel/node';
import db from '../src/server/db/db.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  let dbStatus = "Checking...";
  try {
    const result = await db.query("SELECT NOW()");
    dbStatus = result.rows.length > 0 ? "Online" : "Connection error (no rows)";
  } catch (err: any) {
    dbStatus = `Offline: ${err.message}`;
  }

  res.status(200).json({ 
    message: "pong", 
    status: "Direct Vercel Function Active",
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
}
