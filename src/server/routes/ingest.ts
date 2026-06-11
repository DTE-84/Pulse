import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { query } from "../db/db.js";
import { sanitizeCsvField, validateTransaction } from "../middleware/security.js";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.resolve();

const MAX_TRANSACTIONS = 500;

export const handleIngest = async (req: Request, res: Response) => {
  const { transactions } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  if (!Array.isArray(transactions) || transactions.length === 0)
    return res.status(400).json({ error: "transactions must be a non-empty array." });

  if (transactions.length > MAX_TRANSACTIONS)
    return res.status(400).json({ error: `Payload exceeds maximum of ${MAX_TRANSACTIONS} transactions.` });

  try {
    // 0. Subscription Guard
    const userRes = await query(
      `SELECT subscription_status, trial_ends_at FROM dim_users WHERE user_id = $1`,
      [userId]
    );
    const user = userRes.rows[0];
    const hasActiveSub = user?.subscription_status === 'active' || 
                         (user?.subscription_status === 'trialing' && new Date(user.trial_ends_at) > new Date());
    
    if (!hasActiveSub) {
      return res.status(403).json({ 
        message: "Elite Access Required", 
        detail: "Your trial has ended or subscription is inactive. Ingestion blocked." 
      });
    }

    // 1. AI-Driven Data Integrity: Auto-Categorization & Risk Scoring
    let enrichedTransactions = transactions;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const shouldEnrich = transactions.length <= 50;

    if (apiKey && shouldEnrich) {
      try {
        const client = new Anthropic({ apiKey });
        const prompt = `
          You are Nova's Behavioral Data Wrangler.
          Analyze the following transactions and ensure they have a 'category' and 'risk_level'.

          Categories: Dining, Groceries, Transport, Entertainment, Utilities, Rent, Shopping, Healthcare, Misc.
          Risk Levels (Categorical to Ordinal Mapping): Low, Medium, High, Critical.

          Return ONLY a valid JSON array of objects with the fields: date, amount, category, risk_level.
          Maintain absolute Data Integrity. If a category is ambiguous, use 'Misc'.

          Transactions: ${JSON.stringify(transactions)}
        `;

        const result = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: "You are Nova's Behavioral Data Wrangler. Always return valid JSON.",
          messages: [{ role: "user", content: prompt }]
        });

        const responseText = result.content[0].type === "text" ? result.content[0].text : "";
        const jsonMatch = responseText.match(/\[.*\]/s);
        if (jsonMatch) {
          enrichedTransactions = JSON.parse(jsonMatch[0]);
        }
      } catch (aiErr) {
        console.warn("[!] Nova AI Categorization bypassed due to error:", aiErr);
      }
    } else if (apiKey && !shouldEnrich) {
      console.log(`[Nova Ingest] Payload size (${transactions.length}) exceeds AI enrichment threshold (50). Using rule-based fallback.`);
    }

    // Validate enriched transactions
    for (let i = 0; i < enrichedTransactions.length; i++) {
      const err = validateTransaction(enrichedTransactions[i]);
      if (err) return res.status(400).json({ error: `Transaction ${i} validation failed: ${err}` });
    }

    // 2. High-Fidelity Pipeline (CSV Wrangling)
    const headers = "date,amount,category,risk_level,trigger_id";
    const rows = enrichedTransactions.map((t: any) => [
      sanitizeCsvField(t.date),
      sanitizeCsvField(t.amount),
      sanitizeCsvField(t.category || "Misc"),
      sanitizeCsvField(t.risk_level || "Medium"),
      sanitizeCsvField(t.trigger_id || ""),
    ].join(",")).join("\n");

    const ts = Date.now();
    const tempCsvPath = path.resolve(__dirname, `../db/temp_${userId}_${ts}.csv`);
    const processedCsvPath = path.resolve(__dirname, `../db/processed_${userId}_${ts}.csv`);
    const scriptPath = path.resolve(__dirname, "../scripts/wrangler.py");

    fs.writeFileSync(tempCsvPath, headers + "\n" + rows, { mode: 0o600 });

    await new Promise<void>((resolve, reject) => {
      const proc = spawn("python", [scriptPath, tempCsvPath, processedCsvPath], { stdio: ["ignore", "pipe", "pipe"] });
      let stderr = "";
      proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
      proc.on("close", (code: number | null) => {
        if (code !== 0) reject(new Error(stderr || "Wrangler exited with code " + code));
        else resolve();
      });
      proc.on("error", reject);
    });

    if (!fs.existsSync(processedCsvPath))
      throw new Error("Wrangler did not produce output file.");

    const lines = fs.readFileSync(processedCsvPath, "utf-8")
      .split("\n").slice(1).filter((l: string) => l.trim());

    // 3. Optimized DB Ingestion (Resolve N+1 Query Problem)
    const uniqueCategories = [...new Set(lines.map(l => l.split(",")[2]))];
    
    // Batch fetch existing categories
    const catSearch = await query(
      "SELECT category_id, category_name FROM dim_categories WHERE category_name = ANY($1)",
      [uniqueCategories]
    );
    const catMap = new Map<string, number>();
    catSearch.rows.forEach(r => catMap.set(r.category_name, r.category_id));

    // Handle missing categories
    for (const catName of uniqueCategories) {
      if (!catMap.has(catName)) {
        const newCat = await query(
          "INSERT INTO dim_categories (category_name, risk_level) VALUES ($1, $2) RETURNING category_id",
          [catName, "Medium"]
        );
        catMap.set(catName, newCat.rows[0].category_id);
      }
    }

    let inserted = 0;
    for (const line of lines) {
      const parts = line.split(",");
      if (parts.length < 5) continue;
      const [date, amount, category, risk_level, trigger_id] = parts;

      const categoryId = catMap.get(category);
      const tid = trigger_id && trigger_id.trim() !== "" ? parseInt(trigger_id) : null;

      await query(
        "INSERT INTO fact_transactions (user_id, category_id, amount, purchase_date, status, trigger_id) VALUES ($1, $2, $3, $4, $5, $6)",
        [userId, categoryId, parseFloat(amount), date, "Completed", tid]
      );
      inserted++;
    }

    // Cleanup ephemeral nodes
    try { fs.unlinkSync(tempCsvPath); } catch {}
    try { fs.unlinkSync(processedCsvPath); } catch {}

    res.json({ status: "Synchronized", inserted, message: `High-fidelity ingestion of ${inserted} nodes complete.` });

  } catch (err: any) {
    const isProd = process.env.NODE_ENV === "production";
    console.error("[Nova Ingest CRITICAL]:", err.message);
    res.status(500).json({ 
      error: "Ingest pipeline failed.", 
      detail: isProd ? "Pipeline unavailable." : err.message 
    });
  }
};
