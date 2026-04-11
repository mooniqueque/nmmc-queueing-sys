import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import { db } from './config/database.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiLimiter, authLimiter } from './middleware/rate-limit.js';
import { analyticsRouter } from './modules/analytics/routes.js';
import { authRouter, userRouter } from './modules/auth/routes.js';
import { callerRouter } from './modules/caller/routes.js';
import { monitorRouter } from './modules/monitor/routes.js';
import { releasingRouter } from './modules/releasing/routes.js';
import { sharedRouter } from './modules/shared/routes.js';
import { ticketRouter } from './modules/tickets/routes.js';
import { triageRouter } from './modules/triage/routes.js';
import { workstationRouter } from './modules/workstation/routes.js';

import path from 'path';

export const app = express();

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'cookie'],
}));
app.use(express.json());
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); 
} else {
  app.set('trust proxy', false);
}

// Global API rate limiter (applied to all /api routes)
app.use('/api', apiLimiter);

// Register API routes
app.use('/api/monitor', monitorRouter); // Priority for monitor management
app.use('/api/analytics', analyticsRouter);
app.use('/api/shared', sharedRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/triage', triageRouter);
app.use('/api/releasing', releasingRouter);
app.use('/api/caller', callerRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/users', userRouter);
app.use('/api/workstations', workstationRouter);

app.get('/health', async (req, res) => {
    try {
        // Simple query to verify DB connection
        await db.$queryRaw`SELECT 1`;
        res.json({ 
            status: 'ok', 
            database: 'connected',
            timestamp: new Date().toISOString() 
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'error', 
            database: 'disconnected',
            timestamp: new Date().toISOString() 
        });
    }
});

app.use(errorHandler);

export default app;
