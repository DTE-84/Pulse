import { Request, Response } from "express";
import { query } from "../db/db.js";
import { logAuditAction } from "../middleware/security.js";

export const handleGetUsers = async (req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT user_id, user_name, email, system_role, subscription_status, updated_at FROM dim_users ORDER BY updated_at DESC"
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error("[IAM] Get Users Error:", err.message);
    res.status(500).json({ message: "Failed to fetch users." });
  }
};

export const handleUpdateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role || !['user', 'admin', 'auditor'].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    await query("UPDATE dim_users SET system_role = $1, updated_at = NOW() WHERE user_id = $2", [role, id]);
    
    // Log audit
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    await logAuditAction(req.userId!, "ROLE_CHANGE", ip, { target_user: id, new_role: role });

    res.json({ message: "Role updated successfully." });
  } catch (err: any) {
    console.error("[IAM] Update Role Error:", err.message);
    res.status(500).json({ message: "Failed to update role." });
  }
};

export const handleGetAuditLogs = async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT a.log_id, a.action, a.ip_address, a.details, a.created_at, u.email as user_email
      FROM audit_logs a
      LEFT JOIN dim_users u ON a.user_id = u.user_id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err: any) {
    console.error("[IAM] Get Audit Logs Error:", err.message);
    res.status(500).json({ message: "Failed to fetch audit logs." });
  }
};
