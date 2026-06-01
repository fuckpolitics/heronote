import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

export interface AuthedRequest extends Request {
  userId: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("Нет токена");
    }
    const token = header.slice(7);
    try {
      const payload = this.jwt.verify<{ sub: string }>(token);
      req.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException("Недействительный токен");
    }
  }
}
