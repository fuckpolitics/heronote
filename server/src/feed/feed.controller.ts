import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { FeedService } from "./feed.service";
import { CreateFeedDto } from "./dto";

@UseGuards(JwtAuthGuard)
@Controller("feed")
export class FeedController {
  constructor(private feed: FeedService) {}

  @Get()
  list(@Query("limit") limit?: string) {
    return this.feed.list(limit ? parseInt(limit, 10) : 50);
  }

  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateFeedDto) {
    return this.feed.create(req.userId, dto);
  }
}
