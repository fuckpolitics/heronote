import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { prisma } from "../_lib/prisma";
import { body, cors, publicUser, sign } from "../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ message: "Метод не поддерживается" });

  const { email, password } = body<{ email?: string; password?: string }>(req);
  if (!email || !password) return res.status(400).json({ message: "Введите email и пароль" });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return res.status(401).json({ message: "Неверный email или пароль" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Неверный email или пароль" });

  return res.status(200).json({ token: sign(user.id), user: publicUser(user) });
}
