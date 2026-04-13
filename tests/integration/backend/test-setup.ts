import { PrismaClient } from '@prisma/client';

/**
 * Test database utilities
 * When a test MySQL instance is available, configure TEST_DATABASE_URL in .env.test
 */

let testDb: PrismaClient | null = null;

export async function getTestDb(): Promise<PrismaClient> {
  if (testDb) {
    return testDb;
  }

  const dbUrl = process.env.TEST_DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      'TEST_DATABASE_URL not set. Integration tests require a test database. ' +
      'Set TEST_DATABASE_URL in .env.test or environment variables.'
    );
  }

  testDb = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  return testDb;
}

export async function cleanupTestDb(): Promise<void> {
  if (testDb) {
    await testDb.$disconnect();
    testDb = null;
  }
}

export async function resetTestDatabase(): Promise<void> {
  const db = await getTestDb();

  // Delete data in correct order to respect foreign keys
  await db.visitStatusHistory.deleteMany({});
  await db.visitPriorityCategory.deleteMany({});
  await db.visit.deleteMany({});
  await db.patient.deleteMany({});
  await db.sequence.deleteMany({});
  await db.userDepartmentAccess.deleteMany({});
  await db.workStation.deleteMany({});
  await db.user.deleteMany({});
  await db.department.deleteMany({});
  await db.priorityCategory.deleteMany({});
}

export async function seedTestDepartment(db: PrismaClient) {
  return db.department.create({
    data: {
      id: 'test-dept-1',
      name: 'Cardiology',
      slug: 'cardiology',
      code: 'CARD',
    },
  });
}

export async function seedTestPatient(db: PrismaClient) {
  return db.patient.create({
    data: {
      firstName: 'Maria',
      lastName: 'Santos',
      dateOfBirth: new Date('1980-05-15'),
      gender: 'F',
      contactNo: '09171234567',
      isRegistered: true,
      hospitalId: 'HOSP-001',
    },
  });
}
