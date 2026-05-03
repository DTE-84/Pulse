import { handleStats } from "../src/server/routes/stats";

export default async function (req: any, res: any) {
  return handleStats(req, res, () => {});
}
