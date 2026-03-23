import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { createRequire } from "module";
import pg from "pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "fs";
import { exec } from "child_process";
import * as express from "express";
//#region server/routes/demo.ts
var handleDemo = (req, res) => {
	res.status(200).json({ message: "Hello from Express server" });
};
//#endregion
//#region server/db/db.ts
var { Pool } = pg;
var pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: { rejectUnauthorized: false }
});
var query = (text, params) => pool.query(text, params);
//#endregion
//#region server/routes/stats.ts
var JWT_SECRET$2 = process.env.JWT_SECRET || "dte-high-fidelity-secret";
var handleStats = async (req, res) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) return res.status(401).json({ message: "Authentication required." });
	const token = authHeader.split(" ")[1];
	try {
		const userId = jwt.verify(token, JWT_SECRET$2).id;
		const user = (await query(`
      SELECT 
        baseline_spend, 
        nova_tone,
        COALESCE(monthly_income, 5200.00) as monthly_income,
        COALESCE(initial_balance, 15000.00) as initial_balance
      FROM dim_users 
      WHERE user_id = $1
    `, [userId])).rows[0];
		if (!user) return res.status(404).json({ message: "User not found." });
		const lifetimeRes = await query(`
      SELECT COALESCE(SUM(amount), 0) as lifetime_spend
      FROM fact_transactions
      WHERE user_id = $1
    `, [userId]);
		const lifetimeSpend = parseFloat(lifetimeRes.rows[0].lifetime_spend);
		const now = /* @__PURE__ */ new Date();
		const statsRes = await query(`
      SELECT 
        COALESCE(SUM(amount), 0) as current_month_spend,
        COUNT(*) as transaction_count
      FROM fact_transactions
      WHERE user_id = $1 AND purchase_date >= $2
    `, [userId, new Date(now.getFullYear(), now.getMonth(), 1).toISOString()]);
		const currentMonthSpend = parseFloat(statsRes.rows[0].current_month_spend);
		const chartData = (await query(`
      SELECT 
        TO_CHAR(purchase_date, 'DY') as day,
        SUM(amount) as value
      FROM fact_transactions
      WHERE user_id = $1 AND purchase_date >= NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(purchase_date, 'DY'), EXTRACT(DOW FROM purchase_date)
      ORDER BY EXTRACT(DOW FROM purchase_date)
    `, [userId])).rows.map((row) => ({
			day: row.day.charAt(0).toUpperCase(),
			value: parseFloat(row.value)
		}));
		const totalBalance = parseFloat(user.initial_balance) - lifetimeSpend;
		const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
		const dayOfMonth = now.getDate();
		const daysRemaining = daysInMonth - dayOfMonth;
		const dailyVelocity = currentMonthSpend / (dayOfMonth || 1);
		const predictedBalance = totalBalance - dailyVelocity * daysRemaining;
		let triggers = [];
		const baseline = parseFloat(user.baseline_spend);
		const dailyBaseline = baseline / 30;
		if (currentMonthSpend > baseline) triggers.push({
			id: 1,
			name: "Baseline Breach",
			impact: (currentMonthSpend - baseline).toFixed(2),
			status: "Critical",
			insight: "You have exceeded your target monthly rhythm."
		});
		if (dailyVelocity > dailyBaseline * 1.5) triggers.push({
			id: 2,
			name: "High Velocity",
			impact: dailyVelocity.toFixed(2),
			status: "Active",
			insight: "Current daily spending is 50% above your strategic protocol."
		});
		if (triggers.length === 0) triggers.push({
			id: 0,
			name: "Rhythm Stable",
			impact: 0,
			status: "Optimal",
			insight: "No deviations detected in your capital trajectory."
		});
		const insight = user.nova_tone === "Aggressive" ? `Nova (Aggressive): Capital leak detected. You are $${(currentMonthSpend - baseline).toFixed(2)} off protocol.` : `Nova (Balanced): Your spending rhythm is $${currentMonthSpend.toFixed(2)}. Monitoring for drift.`;
		res.json({
			totalBalance: Number(totalBalance.toFixed(2)),
			monthlyIncome: parseFloat(user.monthly_income),
			monthlyExpenses: currentMonthSpend,
			predictedEndOfMonthBalance: Math.max(0, Number(predictedBalance.toFixed(2))),
			baselineSpend: baseline,
			novaTone: user.nova_tone,
			novaInsight: insight,
			triggers,
			chartData: chartData.length > 0 ? chartData : [
				{
					day: "M",
					value: 0
				},
				{
					day: "T",
					value: 0
				},
				{
					day: "W",
					value: 0
				},
				{
					day: "T",
					value: 0
				},
				{
					day: "F",
					value: 0
				},
				{
					day: "S",
					value: 0
				},
				{
					day: "S",
					value: 0
				}
			]
		});
	} catch (err) {
		console.error("Stats Error:", err);
		res.status(500).json({ error: "Could not calculate telemetry statistics." });
	}
};
//#endregion
//#region server/routes/auth.ts
var JWT_SECRET$1 = process.env.JWT_SECRET || "dte-high-fidelity-secret";
var handleMe = async (req, res) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) return res.status(401).json({ message: "Authentication token missing." });
	const token = authHeader.split(" ")[1];
	try {
		const user = (await query("SELECT user_id, user_name, email, baseline_spend, nova_tone FROM dim_users WHERE user_id = $1", [jwt.verify(token, JWT_SECRET$1).id])).rows[0];
		if (!user) return res.status(404).json({ message: "User entity not found." });
		res.json({
			id: user.user_id,
			email: user.email,
			name: user.user_name,
			baselineSpend: user.baseline_spend,
			novaTone: user.nova_tone,
			onboardingCompleted: true
		});
	} catch (err) {
		res.status(401).json({ message: "Invalid or expired token." });
	}
};
var handleLogin = async (req, res) => {
	const { email, password } = req.body;
	try {
		const user = (await query("SELECT user_id, user_name, email, password, baseline_spend, nova_tone FROM dim_users WHERE email = $1", [email])).rows[0];
		if (!user) return res.status(401).json({ message: "Invalid credentials. Verification failed." });
		if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ message: "Invalid credentials. Verification failed." });
		const token = jwt.sign({
			id: user.user_id,
			email: user.email
		}, JWT_SECRET$1, { expiresIn: "7d" });
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
		if (err.code === "ECONNREFUSED") {
			console.error("System Integrity Breach: Database connection refused.");
			return res.status(503).json({ message: "High-Fidelity DB Connection Failure. Ensure PostgreSQL is active on port 5432." });
		}
		console.error("Login Error:", err);
		res.status(500).json({ message: "System failure during authentication." });
	}
};
var handleSignup = async (req, res) => {
	const { email, password, name } = req.body;
	try {
		if ((await query("SELECT email FROM dim_users WHERE email = $1", [email])).rows.length > 0) return res.status(400).json({ message: "Entity already exists in the DTE ecosystem." });
		const newUser = (await query("INSERT INTO dim_users (user_name, email, password) VALUES ($1, $2, $3) RETURNING user_id, user_name, email", [
			name,
			email,
			await bcrypt.hash(password, 10)
		])).rows[0];
		const token = jwt.sign({
			id: newUser.user_id,
			email: newUser.email
		}, JWT_SECRET$1, { expiresIn: "7d" });
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
		if (err.code === "ECONNREFUSED") {
			console.error("System Integrity Breach: Database connection refused.");
			return res.status(503).json({ message: "High-Fidelity DB Connection Failure. Ensure PostgreSQL is active on port 5432." });
		}
		console.error("Signup Error:", err);
		res.status(500).json({ message: "System failure during entity creation." });
	}
};
var handleUpdateProfile = async (req, res) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) return res.status(401).json({ message: "Authentication required." });
	const token = authHeader.split(" ")[1];
	try {
		const decoded = jwt.verify(token, JWT_SECRET$1);
		const { name, baselineSpend, novaTone } = req.body;
		const result = await query("UPDATE dim_users SET user_name = COALESCE($1, user_name), baseline_spend = COALESCE($2, baseline_spend), nova_tone = COALESCE($3, nova_tone) WHERE user_id = $4 RETURNING *", [
			name,
			baselineSpend,
			novaTone,
			decoded.id
		]);
		if (result.rows.length === -1) return res.status(404).json({ message: "Entity not found." });
		res.json({
			message: "Profile synchronized with Ecosystem.",
			user: result.rows[0]
		});
	} catch (err) {
		res.status(401).json({ message: "Session expired or invalid token." });
	}
};
//#endregion
//#region server/routes/ingest.ts
var __filename$1 = fileURLToPath(import.meta.url);
var __dirname$1 = path.dirname(__filename$1);
var JWT_SECRET = process.env.JWT_SECRET || "dte-high-fidelity-secret";
var handleIngest = async (req, res) => {
	const { transactions } = req.body;
	const authHeader = req.headers.authorization;
	if (!authHeader) return res.status(401).json({ error: "Authentication required for telemetry ingestion." });
	const token = authHeader.split(" ")[1];
	let userId;
	try {
		userId = jwt.verify(token, JWT_SECRET).id;
	} catch (err) {
		return res.status(401).json({ error: "Invalid session." });
	}
	if (!transactions || !Array.isArray(transactions)) return res.status(400).json({ error: "Missing transaction telemetry." });
	const tempCsvPath = path.resolve(__dirname$1, "../db/transactions_temp.csv");
	const headers = "date,amount,category,risk_category\n";
	const rows = transactions.map((t) => `${t.date},${t.amount},${t.category},${t.risk_category}`).join("\n");
	try {
		fs.writeFileSync(tempCsvPath, headers + rows);
		exec(`python "${path.resolve(__dirname$1, "../scripts/wrangler.py")}" "${tempCsvPath}"`, async (error, stdout, stderr) => {
			if (error) {
				console.error(`Wrangler Execution Error: ${error}`);
				return res.status(500).json({
					error: "Behavioral Wrangler failed to initialize.",
					detail: stderr
				});
			}
			const processedCsvPath = path.resolve(__dirname$1, "../db/pulse_ingest.csv");
			if (fs.existsSync(processedCsvPath)) {
				const lines = fs.readFileSync(processedCsvPath, "utf-8").split("\n").slice(1).filter((line) => line.trim() !== "");
				for (const line of lines) {
					const [date, amount, category, risk_category, behavioral_ordinal, rolling_velocity] = line.split(",");
					let catResult = await query("SELECT category_id FROM dim_categories WHERE category_name = $1", [category]);
					let categoryId;
					if (catResult.rows.length === 0) categoryId = (await query("INSERT INTO dim_categories (category_name, risk_level) VALUES ($1, $2) RETURNING category_id", [category, risk_category || "Medium"])).rows[0].category_id;
					else categoryId = catResult.rows[0].category_id;
					await query("INSERT INTO fact_transactions (user_id, category_id, amount, purchase_date, status) VALUES ($1, $2, $3, $4, $5)", [
						userId,
						categoryId,
						parseFloat(amount),
						date,
						"Completed"
					]);
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
//#endregion
//#region server/index.ts
var require = createRequire(import.meta.url);
var express$1 = require("express");
var cors = require("cors");
function createServer() {
	const app = express$1();
	app.use(cors());
	app.use(express$1.json());
	app.use(express$1.urlencoded({ extended: true }));
	app.get("/api/ping", (_req, res) => {
		const ping = process.env.PING_MESSAGE ?? "ping";
		res.json({ message: ping });
	});
	app.get("/api/demo", handleDemo);
	app.get("/api/stats", handleStats);
	app.post("/api/finance/ingest", handleIngest);
	app.post("/api/auth/login", handleLogin);
	app.post("/api/auth/signup", handleSignup);
	app.get("/api/auth/me", handleMe);
	app.patch("/api/auth/update", handleUpdateProfile);
	return app;
}
//#endregion
//#region server/node-build.ts
var app = createServer();
var port = process.env.PORT || 3e3;
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var distPath = path.resolve(__dirname, "../spa");
app.use("/Pulse/assets", express.static(path.join(distPath, "assets"), {
	immutable: true,
	maxAge: "1y",
	fallthrough: false
}));
app.use("/Pulse", express.static(distPath));
app.use((req, res) => {
	if (req.path.startsWith("/api/") || req.path.startsWith("/health")) return res.status(404).json({ error: "API endpoint not found" });
	if (req.path.startsWith("/Pulse")) return res.sendFile(path.join(distPath, "index.html"));
	if (req.path === "/") return res.redirect("/Pulse/");
	res.status(404).json({ error: "Not found" });
});
app.listen(port, () => {
	console.log(`🚀 Fusion Starter server running on port ${port}`);
	console.log(`📱 Frontend: http://localhost:${port}`);
	console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
	console.log("🛑 Received SIGTERM, shutting down gracefully");
	process.exit(0);
});
process.on("SIGINT", () => {
	console.log("🛑 Received SIGINT, shutting down gracefully");
	process.exit(0);
});
//#endregion
export {};

//# sourceMappingURL=node-build.mjs.map