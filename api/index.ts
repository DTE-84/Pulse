import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer } from '../src/server/index';

const app = createServer();

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[VERCEL API] Handling ${req.method} ${req.url}`);
  return app(req as any, res as any);
}
