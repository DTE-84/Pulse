import "dotenv/config";
import { createServer } from "./index.js";

const app = createServer();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 Pulse API Server running on port ${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
