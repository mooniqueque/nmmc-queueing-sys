import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const depts = await db.department.findMany();
  console.log(JSON.stringify(depts, null, 2));
}
main().catch(console.error).finally(() => db.$disconnect());
