import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "./_lib/prisma";
import { auth, body, cors } from "./_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  const userId = auth(req);
  if (!userId) return res.status(401).json({ message: "Нет токена" });

  if (req.method === "GET") {
    const row = await prisma.state.findUnique({ where: { userId } });
    let data: unknown = null;
    if (row) {
      try {
        data = JSON.parse(row.data);
      } catch {
        data = null;
      }
    }
    return res.status(200).json({ data });
  }

  if (req.method === "PUT") {
    const { state } = body<{ state?: unknown }>(req);
    if (state == null || typeof state !== "object") {
      return res.status(400).json({ message: "Некорректное состояние" });
    }
    const serialized = JSON.stringify(state);
    if (serialized.length > 5_000_000) {
      return res.status(400).json({ message: "Состояние слишком большое" });
    }
    const row = await prisma.state.upsert({
      where: { userId },
      create: { userId, data: serialized },
      update: { data: serialized },
    });
    return res.status(200).json({ ok: true, updatedAt: row.updatedAt });
  }

  return res.status(405).json({ message: "Метод не поддерживается" });
}
