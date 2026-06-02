import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "./_lib/prisma";
import { auth, body, cors } from "./_lib/http";

/** Разрешённый набор реакций — фиксированный, чтобы не превращать ленту в свалку. */
const ALLOWED = ["🔥", "💪", "👏", "⚡", "❤️"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  const userId = auth(req);
  if (!userId) return res.status(401).json({ message: "Нет токена" });

  if (req.method !== "POST") return res.status(405).json({ message: "Метод не поддерживается" });

  const { eventId, emoji } = body<{ eventId?: string; emoji?: string }>(req);
  if (!eventId || !emoji) return res.status(400).json({ message: "eventId и emoji обязательны" });
  if (!ALLOWED.includes(emoji)) return res.status(400).json({ message: "Недопустимая реакция" });

  // Тоггл: если реакция уже есть — убираем, иначе ставим
  const existing = await prisma.feedReaction.findUnique({
    where: { eventId_userId_emoji: { eventId, userId, emoji } },
  });
  if (existing) {
    await prisma.feedReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.feedReaction.create({ data: { eventId, userId, emoji } });
  }

  const all = await prisma.feedReaction.findMany({
    where: { eventId },
    select: { emoji: true, userId: true },
  });
  const reactions: Record<string, number> = {};
  const myReactions: string[] = [];
  for (const r of all) {
    reactions[r.emoji] = (reactions[r.emoji] ?? 0) + 1;
    if (r.userId === userId) myReactions.push(r.emoji);
  }
  return res.status(200).json({ eventId, reactions, myReactions });
}
