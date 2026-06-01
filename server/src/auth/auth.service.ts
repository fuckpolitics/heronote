import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto, RegisterDto, UpdateMeDto } from "./dto";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private sign(userId: string) {
    return this.jwt.sign({ sub: userId });
  }

  private publicUser(u: { id: string; email: string; name: string; avatar: string | null }) {
    return { id: u.id, email: u.email, name: u.name, avatar: u.avatar };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException("Пользователь с таким email уже существует");

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email, password, name: dto.name.trim() },
    });
    return { token: this.sign(user.id), user: this.publicUser(user) };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("Неверный email или пароль");

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException("Неверный email или пароль");

    return { token: this.sign(user.id), user: this.publicUser(user) };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.publicUser(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const data: { name?: string; avatar?: string | null } = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.avatar !== undefined) data.avatar = dto.avatar || null;
    const user = await this.prisma.user.update({ where: { id: userId }, data });
    return this.publicUser(user);
  }
}
