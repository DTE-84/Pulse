export default function (req: any, res: any) {
  res.status(200).json({ 
    message: "Environment Diagnostic",
    env_keys: Object.keys(process.env).filter(k => 
      k.includes("DATABASE") || 
      k.includes("GOOGLE") || 
      k.includes("JWT") || 
      k.includes("SUPABASE") ||
      k.includes("VITE_")
    ),
    node_version: process.version,
    platform: process.platform
  });
}
