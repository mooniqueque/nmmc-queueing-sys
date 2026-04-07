require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("[db:verify] DATABASE_URL is not set");
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

async function existsColumn(tableName, columnName) {
  const rows = await db.$queryRawUnsafe(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1",
    tableName,
    columnName
  );
  return rows.length > 0;
}

async function existsIndex(tableName, indexName) {
  const rows = await db.$queryRawUnsafe(
    "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1",
    tableName,
    indexName
  );
  return rows.length > 0;
}

async function existsTable(tableName) {
  const rows = await db.$queryRawUnsafe(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1",
    tableName
  );
  return rows.length > 0;
}

async function hasFailedMigrations() {
  const rows = await db.$queryRawUnsafe(
    "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL"
  );
  return rows;
}

async function main() {
  const missing = [];
  const unexpected = [];

  const requiredColumns = [
    ["department", "slug"],
    ["department", "videoUrl"],
    ["sequence", "description"],
    ["sequence", "prefix"],
    ["sequence", "updatedAt"],
    ["visit", "calledAtStationId"],
    ["visit", "classification"],
    ["visit", "kioskRegistrationType"],
    ["visit", "sequenceKey"],
    ["visit", "queueBusinessDay"],
    ["visit", "triageTicket"],
    ["visit", "serviceTicket"],
  ];

  const requiredIndexes = [
    ["department", "department_slug_key"],
    ["visit", "visit_classification_idx"],
    ["visit", "visit_queueBusinessDay_classification_triageTicket_key"],
    ["visit", "visit_queueBusinessDay_sequenceKey_serviceTicket_key"],
  ];

  const forbiddenColumns = [
    ["visit", "ticketNumber"],
    ["visit", "windowTicketNumber"],
  ];

  const forbiddenIndexes = [
    ["visit", "visit_queueDate_sequenceKey_ticketNumber_key"],
  ];

  const requiredTables = ["priority_category", "visit_priority_category"];

  for (const [tableName, columnName] of requiredColumns) {
    const ok = await existsColumn(tableName, columnName);
    if (!ok) missing.push(`column ${tableName}.${columnName}`);
  }

  for (const [tableName, indexName] of requiredIndexes) {
    const ok = await existsIndex(tableName, indexName);
    if (!ok) missing.push(`index ${tableName}.${indexName}`);
  }

  for (const [tableName, columnName] of forbiddenColumns) {
    const exists = await existsColumn(tableName, columnName);
    if (exists) unexpected.push(`legacy column ${tableName}.${columnName}`);
  }

  for (const [tableName, indexName] of forbiddenIndexes) {
    const exists = await existsIndex(tableName, indexName);
    if (exists) unexpected.push(`legacy index ${tableName}.${indexName}`);
  }

  for (const tableName of requiredTables) {
    const ok = await existsTable(tableName);
    if (!ok) missing.push(`table ${tableName}`);
  }

  const failed = await hasFailedMigrations();

  if (failed.length > 0) {
    missing.push(
      `failed migrations in _prisma_migrations: ${failed
        .map((row) => row.migration_name)
        .join(", ")}` 
    );
  }

  if (missing.length > 0 || unexpected.length > 0) {
    console.error("[db:verify] Schema verification failed.");
    for (const item of missing) {
      console.error(`  - missing ${item}`);
    }
    for (const item of unexpected) {
      console.error(`  - unexpected ${item}`);
    }
    process.exit(1);
  }

  console.log("[db:verify] Schema verification passed.");
}

main()
  .catch((error) => {
    console.error("[db:verify] Unexpected error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
