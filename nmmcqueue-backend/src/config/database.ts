import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
    if (!value) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

const defaultConnectionLimit = process.env.NODE_ENV === 'production' ? 20 : 10;
const connectionLimit = parsePositiveInt(process.env.DB_CONNECTION_LIMIT, defaultConnectionLimit);
const connectTimeout = parsePositiveInt(process.env.DB_CONNECT_TIMEOUT_MS, 10000);
const acquireTimeout = parsePositiveInt(process.env.DB_ACQUIRE_TIMEOUT_MS, 10000);
const idleTimeout = parsePositiveInt(process.env.DB_IDLE_TIMEOUT_MS, 30000);

const url = new URL(connectionString);
const poolOptions = {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.substring(1),
    connectionLimit,
    connectTimeout,
    acquireTimeout,
    idleTimeout,
};

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
