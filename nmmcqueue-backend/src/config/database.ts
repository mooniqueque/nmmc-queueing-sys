import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';


const connectionString = process.env.DATABASE_URL || '';

let poolOptions: { host: string; port: number; user: string; password: string; database: string; connectionLimit: number; } | {} = {};
try {
    const url = new URL(connectionString);
    poolOptions = {
        host: url.hostname,
        port: Number(url.port) || 3306,
        user: url.username,
        password: decodeURIComponent(url.password),
        database: url.pathname.substring(1),
        connectionLimit: 5,
    };
} catch (e) {
    console.error("Failed to parse database URL");
}

const adapter = new PrismaMariaDb(poolOptions as any);

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

export const db = global.prisma || new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'production'
        ? ['warn', 'error']
        : ['query', 'info', 'warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
    global.prisma = db;
}
