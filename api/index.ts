export default function (_req: any, res: any) {
  res.status(200).json({ 
    message: "Pulse API Index (Native)",
    endpoints: ["/api/ping", "/api/health", "/api/nova/chat"],
    status: "online"
  });
}
