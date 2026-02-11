import { PrismaClient } from "@prisma/client";

//global calling
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ||
    new PrismaClient({
        log: ["query"], //printing sql commands to the console
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;