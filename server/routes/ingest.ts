import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { query } from "../db/db";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || "dte-high-fidelity-secret";

export const handleIngest = async (req: Request, res: Response) => {
  const { transactions } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ error: "Authentication required for telemetry ingestion." });
  const token = authHeader.split(" ")[1];

  let userId: string;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    userId = decoded.id;
  } catch (err) {
    return res.status(401).json({ error: "Invalid session." });
  }

  if (!transactions || !Array.isArray(transactions)) {
    return res.status(400).json({ error: "Missing transaction telemetry." });
  }

  // 1. Convert JSON transactions to temporary CSV for the Python Wrangler
  const tempCsvPath = path.resolve(__dirname, "../db/transactions_temp.csv");
  const headers = "date,amount,category,risk_category\n";
  const rows = transactions.map(t => `${t.date},${t.amount},${t.category},${t.risk_category}`).join("\n");
  
  try {
    fs.writeFileSync(tempCsvPath, headers + rows);

    // 2. Execute Python Wrangler
    const scriptPath = path.resolve(__dirname, "../scripts/wrangler.py");
    const pythonCmd = "python"; 
    
    exec(`${pythonCmd} "${scriptPath}" "${tempCsvPath}"`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Wrangler Execution Error: ${error}`);
        return res.status(500).json({ error: "Behavioral Wrangler failed to initialize.", detail: stderr });
      }
      
      // 3. Process the Wrangler output (pulse_ingest.csv) and insert into DB
      const processedCsvPath = path.resolve(__dirname, "../db/pulse_ingest.csv");
      if (fs.existsSync(processedCsvPath)) {
        const data = fs.readFileSync(processedCsvPath, "utf-8");
        const lines = data.split("\n").slice(1).filter(line => line.trim() !== "");
        
        for (const line of lines) {
          const [date, amount, category, risk_category, behavioral_ordinal, rolling_velocity] = line.split(",");
          
          // Ensure category exists in dim_categories
          let catResult = await query("SELECT category_id FROM dim_categories WHERE category_name = $1", [category]);
          let categoryId: number;
          
          if (catResult.rows.length === 0) {
            const newCat = await query(
              "INSERT INTO dim_categories (category_name, risk_level) VALUES ($1, $2) RETURNING category_id",
              [category, risk_category || 'Medium']
            );
            categoryId = newCat.rows[0].category_id;
          } else {
            categoryId = catResult.rows[0].category_id;
          }

          // Insert transaction
          await query(
            "INSERT INTO fact_transactions (user_id, category_id, amount, purchase_date, status) VALUES ($1, $2, $3, $4, $5)",
            [userId, categoryId, parseFloat(amount), date, 'Completed']
          );
        }
      }

      res.json({ 
        status: "Synchronized", 
        message: "Natural input processed and persisted to High-Fidelity Star Schema.",
        wranglerOutput: stdout.trim()
      });
    });

  } catch (err) {
    console.error("Ingest Error:", err);
    res.status(500).json({ error: "System Integrity Breach: Could not process ingestion." });
  }
};
