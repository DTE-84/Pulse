import { Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dte-high-fidelity-secret";

// MOCK DATABASE FOR INITIAL STITCHING
// In production, this will interface with your Postgres/Prisma layer
const users: any[] = [];

export const handleLogin = (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials. Verification failed." });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, onboardingCompleted: user.onboardingCompleted } });
};

export const handleSignup = (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: "Entity already exists in the DTE ecosystem." });
  }

  const newUser = { id: Date.now().toString(), email, password, name, onboardingCompleted: false };
  users.push(newUser);

  const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" });
  res.status(201).json({ token, user: { id: newUser.id, email: newUser.email, name: newUser.name, onboardingCompleted: newUser.onboardingCompleted } });
};

export const handleMe = (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authentication required." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ message: "Session expired or invalid token." });
  }
};
