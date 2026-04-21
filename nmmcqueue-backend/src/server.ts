import 'dotenv/config';
import { app } from './app.js';
import { db } from './config/database.js';
import logger from './lib/logger.js';
import { startFailsafeTimer, stopFailsafeTimer } from './lib/failsafe.js';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(Number(PORT), HOST, () => {
    logger.info(`[server]: Server is running at http://${HOST}:${PORT}`);
    startFailsafeTimer();
});

/**
 * Graceful Shutdown Handler
 */
const shutdown = async (signal: string) => {
    logger.info(`${signal} signal received: closing HTTP server`);
    stopFailsafeTimer();
    server.close(async () => {
        logger.info('HTTP server closed');
        try {
            await db.$disconnect();
            logger.info('Database connection closed');
            process.exit(0);
        } catch (err) {
            logger.error('Error during database disconnection:', err);
            process.exit(1);
        }
    });

    // Force shutdown if graceful fails after 10s
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
