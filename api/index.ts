export default async function (req: any, res: any) {
  try {
    const { createServer } = await import("../src/server/index");
    const app = createServer();
    return app(req, res);
  } catch (err: any) {
    res.status(500).json({
      error: "Server Startup Error",
      message: err.message,
      detail: "Check Vercel logs or individual route imports."
    });
  }
}
