import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFeedDto } from "./dto";

@Injectable()
export class FeedService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateFeedDto) {
    const e = await this.prisma.feedEvent.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        detail: dto.detail,
        icon: dto.icon,
        color: dto.color,
      },
      include: { user: { select: { name: true, avatar: true } } },
    });
    return this.shape(e);
  }

  async list(limit = 50) {
    const safe = Math.min(Math.max(limit, 1), 100);
    const rows = await this.prisma.feedEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: safe,
      include: { user: { select: { name: true, avatar: true } } },
    });
    return rows.map((r) => this.shape(r));
  }

  private shape(e: {
    id: string;
    userId: string;
    type: string;
    title: string;
    detail: string | null;
    icon: string | null;
    color: string | null;
    createdAt: Date;
    user: { name: string; avatar: string | null };
  }) {
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
    };
  }
}
