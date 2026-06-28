// api/lib/syntheticTransactions.ts
// Re-export from src/lib so Vercel serverless functions can resolve this
// without needing to climb outside the /api directory tree.
export { generateTransactions, generateHistoricalSeed } from '../../src/lib/syntheticTransactions.js';
