import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "../db/db";

const JWT_SECRET = process.env.JWT_SECRET || "dte-high-fidelity-secret";

export const handleMe = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authentication token missing." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    const result = await query(
      "SELECT user_id, user_name, email, baseline_spend, nova_tone FROM dim_users WHERE user_id = $1",
      [decoded.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User entity not found." });
    }

    res.json({ 
      id: user.user_id, 
      email: user.email, 
      name: user.user_name, 
      baselineSpend: user.baseline_spend,
      novaTone: user.nova_tone,
      onboardingCompleted: true // Simplified for production test
    });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

export const handleLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  try {
    const result = await query(
      "SELECT user_id, user_name, email, password, baseline_spend, nova_tone FROM dim_users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials. Verification failed." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials. Verification failed." });
    }

    const token = jwt.sign({ id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ 
      token, 
      user: { 
        id: user.user_id, 
        email: user.email, 
        name: user.user_name,
        baselineSpend: user.baseline_spend,
        novaTone: user.nova_tone,
        onboardingCompleted: true 
      } 
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "System failure during authentication." });
  }
};

export const handleSignup = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  try {
    const checkUser = await query("SELECT email FROM dim_users WHERE email = $1", [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: "Entity already exists in the DTE ecosystem." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await query(
      "INSERT INTO dim_users (user_name, email, password) VALUES ($1, $2, $3) RETURNING user_id, user_name, email",
      [name, email, hashedPassword]
    );

    const newUser = result.rows[0];

    const token = jwt.sign({ id: newUser.user_id, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ 
      token, 
      user: { 
        id: newUser.user_id, 
        email: newUser.email, 
        name: newUser.user_name, 
        onboardingCompleted: true 
      } 
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "System failure during entity creation." });
  }
};

export const handleUpdateProfile = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authentication required." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    const { name, baselineSpend, novaTone } = req.body;

    const result = await query(
      "UPDATE dim_users SET user_name = COALESCE($1, user_name), baseline_spend = COALESCE($2, baseline_spend), nova_tone = COALESCE($3, nova_tone) WHERE user_id = $4 RETURNING *",
      [name, baselineSpend, novaTone, decoded.id]
    );
    
    if (result.rows.length === -1) {
      return res.status(404).json({ message: "Entity not found." });
    }

    res.json({ message: "Profile synchronized with Ecosystem.", user: result.rows[0] });
  } catch (err) {
    res.status(401).json({ message: "Session expired or invalid token." });
  }
};
