import { RequestHandler } from "express";
import { query } from "../db/db.js";

export const handleGetTransactions: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : null;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized access." });
    }

    let sql = `
      SELECT 
        t.*,
        c.category_name,
        tr.trigger_name
      FROM fact_transactions t
      LEFT JOIN dim_categories c ON t.category_id = c.category_id
      LEFT JOIN dim_triggers tr ON t.trigger_id = tr.trigger_id
      WHERE t.user_id = $1
      ORDER BY t.purchase_date DESC
    `;
    
    const params: any[] = [userId];
    if (limit) {
      sql += " LIMIT $2";
      params.push(limit);
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error("[TRANSACTIONS_GET_ERROR]", err);
    res.status(500).json({ error: "Failed to fetch transactions." });
  }
};
