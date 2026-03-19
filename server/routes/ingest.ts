import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const handleIngest = async (req: Request, res: Response) => {
  const { transactions } = req.body;

  if (!transactions || !Array.isArray(transactions)) {
    return res.status(400).json({ error: "Missing transaction telemetry." });
  }

  // 1. Convert JSON transactions to temporary CSV for the Python Wrangler
  const tempCsvPath = path.resolve(__dirname, "../db/transactions_temp.csv");
  const headers = "date,amount,category,risk_category\n";
  const rows = transactions.map(t => `${t.date},${t.amount},${t.category},${t.risk_category}`).join("\n");
  
  try {
    fs.writeFileSync(tempCsvPath, headers + rows);

    // 2. Execute Python Wrangler (The High-Fidelity Engine)
    const scriptPath = path.resolve(__dirname, "../scripts/wrangler.py");
    
    // Using full path to python for reliability on Windows
    const pythonCmd = "python"; 
    
    exec(`${pythonCmd} "${scriptPath}" "${tempCsvPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Wrangler Execution Error: ${error}`);
        return res.status(500).json({ error: "Behavioral Wrangler failed to initialize.", detail: stderr });
      }
      
      console.log(`Wrangler Output: ${stdout}`);
      
      // 3. Success Response
      res.json({ 
        status: "Synchronized", 
        message: "Natural input processed by Pulse Wrangler.",
        wranglerOutput: stdout.trim()
      });
    });

  } catch (err) {
    console.error("Ingest Error:", err);
    res.status(500).json({ error: "System Integrity Breach: Could not process ingestion." });
  }
};
