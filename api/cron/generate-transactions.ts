// api/cron/generate-transactions.ts
// Vercel serves this file before the /api rewrite reaches Express, so it must
// use the same handler as the Express route — keep the logic in one place.
export { default } from '../../src/server/routes/cron.js';
