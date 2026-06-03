import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ 
    message: "pong", 
    status: "Direct Vercel Function Active",
    timestamp: new Date().toISOString()
  });
}
