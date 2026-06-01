import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../_lib/prisma";
import { auth, body, cors, publicUser } from "../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  const userId = auth(req);
  if (!userId) return res.status(401).json({ message: "Нет токена" });

  if (req.method === "GET") {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ message: "Пользователь не найден" });
    return res.status(200).json(publicUser(user));
  }

  if (req.method === "PATCH") {
    const { name, avatar } = body<{ name?: string; avatar?: string | null }>(req);
    const data: { name?: string; avatar?: string | null } = {};
    if (name !== undefined) data.name = String(name).trim().slice(0, 40);
    if (avatar !== undefined) data.avatar = avatar ? String(avatar).slice(0, 400000) : null;
    const user = await prisma.user.update({ where: { id: userId }, data });
    return res.status(200).json(publicUser(user));
  }

  return res.status(405).json({ message: "Метод не поддерживается" });
}
