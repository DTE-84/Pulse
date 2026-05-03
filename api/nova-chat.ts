import { handleNovaChat } from "../src/server/routes/chat";

export default async function (req: any, res: any) {
  return handleNovaChat(req, res, () => {});
}
