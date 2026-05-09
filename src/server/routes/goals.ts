import { RequestHandler } from "express";
import { query } from "../db/db";

export const handleGetGoals: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized access." });

    const result = await query(
      `SELECT goal_id, goal_name as name, target_amount as target, current_progress as current, deadline 
       FROM dim_goals WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("[GOALS_GET_ERROR]", err);
    res.status(500).json({ error: "Failed to fetch goals." });
  }
};

export const handleCreateGoal: RequestHandler = async (req, res) => {
  try {
    const { name, target, deadline } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized access." });
    if (!name || target === undefined || target === null) {
      return res.status(400).json({ error: "Goal name and target amount are required." });
    }

    const result = await query(
      `INSERT INTO dim_goals (user_id, goal_name, target_amount, deadline) 
       VALUES ($1, $2, $3, $4) RETURNING goal_id, goal_name as name, target_amount as target, current_progress as current, deadline`,
      [userId, name, target, deadline || null]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("[GOALS_CREATE_ERROR]", err);
    res.status(500).json({ error: "Failed to create goal." });
  }
};
