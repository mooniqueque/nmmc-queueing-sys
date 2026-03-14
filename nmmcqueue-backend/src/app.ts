import cors from 'cors';
import express from 'express';
import { authRouter, userRouter } from './modules/auth/routes.js';
import { callerRouter } from './modules/caller/routes.js';
import { monitorRouter } from './modules/monitor/routes.js';
import { releasingRouter } from './modules/releasing/routes.js';
import { sharedRouter } from './modules/shared/routes.js';
import { triageRouter } from './modules/triage/routes.js';
import { workstationRouter } from './modules/workstation/routes.js';

export const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'cookie'],
}));
app.use(express.json());

// Register API routes
app.use('/api/shared', sharedRouter);
app.use('/api/monitor', monitorRouter);
app.use('/api/triage', triageRouter);
app.use('/api/releasing', releasingRouter);
app.use('/api/caller', callerRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/workstations', workstationRouter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

export default app;
