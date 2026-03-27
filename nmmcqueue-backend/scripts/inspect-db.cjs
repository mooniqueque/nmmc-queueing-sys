const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
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

async function printTable(title, sql) {
  const rows = await db.$queryRawUnsafe(sql);
  console.log(`\n=== ${title} ===`);
  if (!rows || rows.length === 0) {
    console.log("(no rows)");
    return;
  }
  console.table(rows);
}

(async () => {
  await printTable("department (top 10)", "SELECT id, name, slug, code, createdAt FROM department ORDER BY createdAt ASC LIMIT 10");
  await printTable("workstation (top 10)", "SELECT id, name, type, stationNo, isActive, departmentId FROM workstation ORDER BY name ASC LIMIT 10");
  await printTable("user (top 10)", "SELECT id, name, email, role, departmentId, workstationId, createdAt FROM user ORDER BY createdAt ASC LIMIT 10");
  await printTable("account (top 10)", "SELECT id, userId, providerId, createdAt FROM account ORDER BY createdAt ASC LIMIT 10");
  await printTable("session (top 10)", "SELECT id, userId, expiresAt, createdAt FROM session ORDER BY createdAt ASC LIMIT 10");
  await printTable("visit (top 10)", "SELECT id, patientId, departmentId, ticketNumber, status, createdAt FROM visit ORDER BY createdAt ASC LIMIT 10");
  await printTable("patient (top 10)", "SELECT id, firstName, lastName, gender, dateOfBirth, createdAt FROM patient ORDER BY createdAt ASC LIMIT 10");

  await db.$disconnect();
})().catch(async (e) => {
  console.error("DB inspect failed:", e);
  try { await db.$disconnect(); } catch {}
  process.exit(1);
});
