import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
//global calling
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

export const db = globalForPrisma.prisma ||
    //utilizing adapter and printing sql queries in console 
    new PrismaClient({ adapter, log: ["query"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;