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

  if (!Array.isArray(transactions) || transactions.length === 0)
    return res.status(400).json({ error: "transactions must be a non-empty array." });

  if (transactions.length > MAX_TRANSACTIONS)
    return res.status(400).json({ error: `Payload exceeds maximum of ${MAX_TRANSACTIONS} transactions.` });

  // 1. AI-Driven Data Integrity: Auto-Categorization & Risk Scoring
  let enrichedTransactions = transactions;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
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
      // Basic JSON extraction in case Claude wraps in code blocks
      const jsonMatch = responseText.match(/\[.*\]/s);
      if (jsonMatch) {
        enrichedTransactions = JSON.parse(jsonMatch[0]);
      }
    } catch (aiErr) {
      console.warn("[!] Nova AI Categorization bypassed due to error:", aiErr);
      // Continue with raw transactions if AI fails - prioritize Data Availability
    }
  } else {
    console.warn("[!] ANTHROPIC_API_KEY missing. Bypassing AI enrichment.");
  }

  // Validate enriched transactions
  for (let i = 0; i < enrichedTransactions.length; i++) {
    const err = validateTransaction(enrichedTransactions[i]);
    if (err) return res.status(400).json({ error: `Transaction ${i} validation failed: ${err}` });
  }

  // Build CSV with sanitized values
  const headers = "date,amount,category,risk_level,trigger_id";
  const rows = enrichedTransactions.map((t: any) => [
    sanitizeCsvField(t.date),
    sanitizeCsvField(t.amount),
    sanitizeCsvField(t.category || "Misc"),
    sanitizeCsvField(t.risk_level || "Medium"),
    sanitizeCsvField(t.trigger_id || ""),
  ].join(",")).join("\n");

  const tempCsvPath = path.resolve(__dirname, "../db/transactions_temp.csv");
  const scriptPath = path.resolve(__dirname, "../scripts/wrangler.py");

  try {
    fs.writeFileSync(tempCsvPath, headers + "\n" + rows, { mode: 0o600 });

    await new Promise<void>((resolve, reject) => {
      const proc = spawn("python", [scriptPath, tempCsvPath], { stdio: ["ignore", "pipe", "pipe"] });
      let stderr = "";
      proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
      proc.on("close", (code: number | null) => {
        if (code !== 0) reject(new Error(stderr || "Wrangler exited with code " + code));
        else resolve();
      });
      proc.on("error", reject);
    });

    const processedCsvPath = path.resolve(__dirname, "../db/pulse_ingest.csv");
    if (!fs.existsSync(processedCsvPath))
      return res.status(500).json({ error: "Wrangler did not produce output file." });

    const lines = fs.readFileSync(processedCsvPath, "utf-8")
      .split("\n").slice(1).filter((l: string) => l.trim());

    let inserted = 0;
    for (const line of lines) {
      const parts = line.split(",");
      if (parts.length < 5) continue;
      const [date, amount, category, risk_level, trigger_id] = parts;

      let catResult = await query("SELECT category_id FROM dim_categories WHERE category_name = $1", [category]);
      let categoryId: number;
      if (catResult.rows.length === 0) {
        const newCat = await query(
          "INSERT INTO dim_categories (category_name, risk_level) VALUES ($1, $2) RETURNING category_id",
          [category, risk_level || "Medium"]
        );
        categoryId = newCat.rows[0].category_id;
      } else {
        categoryId = catResult.rows[0].category_id;
      }

      const tid = trigger_id && trigger_id.trim() !== "" ? parseInt(trigger_id) : null;

      await query(
        "INSERT INTO fact_transactions (user_id, category_id, amount, purchase_date, status, trigger_id) VALUES ($1, $2, $3, $4, $5, $6)",
        [userId, categoryId, parseFloat(amount), date, "Completed", tid]
      );
      inserted++;
    }

    try { fs.unlinkSync(tempCsvPath); } catch {}
    try { fs.unlinkSync(processedCsvPath); } catch {}

    res.json({ status: "Synchronized", inserted, message: `High-fidelity ingestion of ${inserted} nodes complete.` });

  } catch (err: any) {
    console.error("Ingest Error:", err.message);
    res.status(500).json({ error: "Ingest pipeline failed.", detail: err.message });
  }
};
