import { PrismaClient } from "@prisma/client";

// Переиспользуем один клиент между «тёплыми» вызовами функции (serverless).
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
g.prisma = prisma;
