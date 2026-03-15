import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const depts = await prisma.department.findMany();
  console.log('Current Departments:', depts.map(d => d.name));

  const cashierRegName = 'CASHIER / REGISTRATION';
  const existing = await prisma.department.findUnique({
    where: { name: cashierRegName }
  });

  if (!existing) {
    console.log(`Adding ${cashierRegName}...`);
    await prisma.department.create({
      data: {
        name: cashierRegName,
        code: 'CASHIER_REG'
      }
    });
    console.log('Added successfully.');
  } else {
    console.log(`${cashierRegName} already exists.`);
  }

  // Also check for ADMINISTRATION
  const admin = depts.find(d => d.name === 'ADMINISTRATION');
  if (admin) {
    console.log('ADMINISTRATION exists and will be filtered in the UI.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
