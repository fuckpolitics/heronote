import { Body, Controller, Get, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto, UpdateMeDto } from "./dto";
import { AuthedRequest, JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() req: AuthedRequest) {
    return this.auth.me(req.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("me")
  updateMe(@Req() req: AuthedRequest, @Body() dto: UpdateMeDto) {
    return this.auth.updateMe(req.userId, dto);
  }
}
