export default function (req: any, res: any) {
  res.status(200).json({ 
    message: "Pulse API Bootloader",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
}
