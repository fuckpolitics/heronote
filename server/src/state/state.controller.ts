import { Body, Controller, Get, Put, Req, UseGuards } from "@nestjs/common";
import { AuthedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { StateService } from "./state.service";

@UseGuards(JwtAuthGuard)
@Controller("state")
export class StateController {
  constructor(private state: StateService) {}

  @Get()
  async get(@Req() req: AuthedRequest) {
    const data = await this.state.get(req.userId);
    return { data };
  }

  @Put()
  save(@Req() req: AuthedRequest, @Body() body: { state: unknown }) {
    return this.state.save(req.userId, body?.state);
  }
}
