// Запускается из postinstall. На Vercel создаёт/обновляет таблицы в БД
// (prisma db push). Локально (без env VERCEL) ничего не делает.
if (process.env.VERCEL) {
  const { execSync } = require("child_process");
  execSync("prisma db push --skip-generate --accept-data-loss", { stdio: "inherit" });
}
