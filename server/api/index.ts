// Точка входа для Vercel (serverless). Поднимает NestJS из СКОМПИЛИРОВАННОГО
// кода (dist/), чтобы сохранить метаданные декораторов (иначе ломается DI),
// и кэширует приложение между запросами.
import "reflect-metadata";
import express from "express";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { AppModule } from "../dist/app.module";

let cached: express.Express | null = null;

async function bootstrap(): Promise<express.Express> {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ["error", "warn"],
  });

  const origin = process.env.CORS_ORIGIN || "*";
  app.enableCors({
    origin: origin === "*" ? true : origin.split(",").map((s) => s.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  await app.init();
  return expressApp;
}

export default async function handler(req: express.Request, res: express.Response) {
  if (!cached) cached = await bootstrap();
  cached(req, res);
}
