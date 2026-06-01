// Запускается из postinstall. На Vercel компилирует TypeScript в dist/
// (с метаданными декораторов — критично для DI NestJS) и создаёт таблицы в БД.
// Локально (без env VERCEL) ничего из этого не делает.
if (process.env.VERCEL) {
  const { execSync } = require("child_process");
  const run = (cmd) => execSync(cmd, { stdio: "inherit" });
  run("tsc -p tsconfig.json");
  run("prisma db push --skip-generate --accept-data-loss");
}
