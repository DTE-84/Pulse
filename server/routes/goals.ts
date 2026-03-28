import { RequestHandler } from "express";
import { query } from "../db/db";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middleware/security";

export const handleGetGoals: RequestHandler = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authentication required." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const result = await query(
      `SELECT goal_id, goal_name as name, target_amount as target, current_progress as current, deadline 
       FROM dim_goals WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch goals." });
  }
};

export const handleCreateGoal: RequestHandler = async (req, res) => {
  const { name, target, deadline } = req.body;
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authentication required." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const result = await query(
      `INSERT INTO dim_goals (user_id, goal_name, target_amount, deadline) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, name, target, deadline]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create goal." });
  }
};
