import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StateService {
  constructor(private prisma: PrismaService) {}

  /** Возвращает AppState пользователя или null (фронт сам создаст начальный). */
  async get(userId: string): Promise<unknown | null> {
    const row = await this.prisma.state.findUnique({ where: { userId } });
    if (!row) return null;
    try {
      return JSON.parse(row.data);
    } catch {
      return null;
    }
  }

  /** Полностью перезаписывает состояние пользователя (upsert). */
  async save(userId: string, state: unknown): Promise<{ ok: true; updatedAt: Date }> {
    if (state == null || typeof state !== "object") {
      throw new BadRequestException("Некорректное состояние");
    }
    const data = JSON.stringify(state);
    // защита от слишком больших полезных нагрузок (~5 МБ)
    if (data.length > 5_000_000) throw new BadRequestException("Состояние слишком большое");

    const row = await this.prisma.state.upsert({
      where: { userId },
      create: { userId, data },
      update: { data },
    });
    return { ok: true, updatedAt: row.updatedAt };
  }
}
