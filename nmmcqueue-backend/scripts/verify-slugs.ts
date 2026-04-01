import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('--- Verifying Departments Slugs ---');
  const depts = await prisma.department.findMany({
    select: { name: true, slug: true, id: true }
  });
  console.table(depts);

  if (depts.length > 0) {
    const slug = depts[0].slug;
    console.log(`\n--- Testing Monitor API for slug: ${slug} ---`);
    // Since I can't easily run a fetch against the running server here without starting it,
    // I will at least check if the slug generation worked as expected in the DB.
  }
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
