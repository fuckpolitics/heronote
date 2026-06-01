import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { prisma } from "../_lib/prisma";
import { body, cors, publicUser, sign } from "../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ message: "Метод не поддерживается" });

  const { email, password, name } = body<{ email?: string; password?: string; name?: string }>(req);
  if (!email || !/.+@.+\..+/.test(email)) return res.status(400).json({ message: "Некорректный email" });
  if (!password || password.length < 6) return res.status(400).json({ message: "Пароль минимум 6 символов" });
  if (!name || !name.trim()) return res.status(400).json({ message: "Укажите имя" });

  const e = email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email: e } });
  if (exists) return res.status(409).json({ message: "Пользователь с таким email уже существует" });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email: e, password: hash, name: name.trim() } });
  return res.status(201).json({ token: sign(user.id), user: publicUser(user) });
}
