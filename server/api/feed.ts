import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "./_lib/prisma";
import { auth, body, cors } from "./_lib/http";

function shape(
  e: {
    id: string;
    userId: string;
    type: string;
    title: string;
    detail: string | null;
    icon: string | null;
    color: string | null;
    createdAt: Date;
    user: { name: string; avatar: string | null };
    reactions?: { emoji: string; userId: string }[];
  },
  meId: string,
) {
  const reactions: Record<string, number> = {};
  const myReactions: string[] = [];
  for (const r of e.reactions ?? []) {
    reactions[r.emoji] = (reactions[r.emoji] ?? 0) + 1;
    if (r.userId === meId) myReactions.push(r.emoji);
  }
  return {
    id: e.id,
    userId: e.userId,
    userName: e.user.name,
    userAvatar: e.user.avatar,
    type: e.type,
    title: e.title,
    detail: e.detail,
    icon: e.icon,
    color: e.color,
    createdAt: e.createdAt,
    reactions,
    myReactions,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  const userId = auth(req);
  if (!userId) return res.status(401).json({ message: "Нет токена" });

  if (req.method === "GET") {
    const raw = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const limit = Math.min(Math.max(parseInt(raw || "50", 10) || 50, 1), 100);
    const rows = await prisma.feedEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { name: true, avatar: true } },
        reactions: { select: { emoji: true, userId: true } },
      },
    });
    return res.status(200).json(rows.map((r) => shape(r, userId)));
  }

  if (req.method === "POST") {
    const { type, title, detail, icon, color } = body<{
      type?: string;
      title?: string;
      detail?: string;
      icon?: string;
      color?: string;
    }>(req);
    if (!type || !title) return res.status(400).json({ message: "type и title обязательны" });
    const e = await prisma.feedEvent.create({
      data: {
        userId,
        type: String(type).slice(0, 20),
        title: String(title).slice(0, 140),
        detail: detail ? String(detail).slice(0, 200) : null,
        icon: icon ? String(icon).slice(0, 8) : null,
        color: color ? String(color).slice(0, 16) : null,
      },
      include: {
        user: { select: { name: true, avatar: true } },
        reactions: { select: { emoji: true, userId: true } },
      },
    });
    return res.status(201).json(shape(e, userId));
  }

  return res.status(405).json({ message: "Метод не поддерживается" });
}
