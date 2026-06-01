import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

/** Ставит CORS-заголовки. Возвращает true, если это preflight (OPTIONS) и ответ уже завершён. */
export function cors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

export function sign(userId: string): string {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: "30d" });
}

/** Возвращает userId из заголовка Authorization или null. */
export function auth(req: VercelRequest): string | null {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(h.slice(7), SECRET) as { sub: string };
    return payload.sub;
  } catch {
    return null;
  }
}

/** Безопасно достаёт тело запроса как объект. */
export function body<T = Record<string, unknown>>(req: VercelRequest): T {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return {} as T;
    }
  }
  return (req.body || {}) as T;
}

export function publicUser(u: { id: string; email: string; name: string; avatar: string | null }) {
  return { id: u.id, email: u.email, name: u.name, avatar: u.avatar };
}
