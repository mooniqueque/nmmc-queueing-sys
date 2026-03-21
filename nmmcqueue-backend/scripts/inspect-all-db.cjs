require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const parsed = new URL(rawUrl);
const adapter = new PrismaMariaDb({
  host: parsed.hostname,
  port: parsed.port ? parseInt(parsed.port, 10) : 3306,
  user: parsed.username ? decodeURIComponent(parsed.username) : undefined,
  password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
  database: parsed.pathname.replace(/^\//, "") || undefined,
});

const db = new PrismaClient({ adapter });

async function main() {
  const tables = await db.$queryRawUnsafe(
    "SELECT table_name AS tableName FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name"
  );

  console.log("\n=== ALL TABLES (CURRENT DB) ===");
  if (!tables || tables.length === 0) {
    console.log("(no tables found)");
    return;
  }
  console.table(tables);

  console.log("\n=== ROW COUNTS PER TABLE ===");
  const tick = "`";
  for (const t of tables) {
    const name = String(t.tableName);
    const safeName = `${tick}${name.replace(/`/g, "``")}${tick}`;
    const rows = await db.$queryRawUnsafe(
      `SELECT COUNT(*) AS total FROM ${safeName}`
    );
    console.log(`${name}: ${rows[0].total}`);
  }

  console.log("\n=== SAMPLE DATA (TOP 10 PER TABLE) ===");
  for (const t of tables) {
    const name = String(t.tableName);
    const safeName = `${tick}${name.replace(/`/g, "``")}${tick}`;
    const sampleRows = await db.$queryRawUnsafe(
      `SELECT * FROM ${safeName} LIMIT 10`
    );

    console.log(`\n--- ${name} ---`);
    if (!sampleRows || sampleRows.length === 0) {
      console.log("(no rows)");
      continue;
    }
    console.table(sampleRows);
  }
}

main()
  .catch((e) => {
    console.error("DB table inspection failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
