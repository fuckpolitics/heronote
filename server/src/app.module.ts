import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { StateModule } from "./state/state.module";
import { FeedModule } from "./feed/feed.module";

@Module({
  imports: [PrismaModule, AuthModule, StateModule, FeedModule],
})
export class AppModule {}
