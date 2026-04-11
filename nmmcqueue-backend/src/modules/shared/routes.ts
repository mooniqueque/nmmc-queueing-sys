import type { AnalyticsScope } from '@nmmc/types';
import { Request, Response, Router } from 'express';
import logger from '../../lib/logger.js';
import { asyncHandler } from '../../middleware/error-handler.js';
import { requireAuth } from '../../middleware/rbac.js';
import type { AuthenticatedRequest } from '../../middleware/types.js';
import { callerController } from '../caller/controller.js';
import { getAnalytics } from './analytics.js';

export const sharedRouter = Router();

// ─── Public Reference Data ─────────────────────────────────────
// These endpoints serve read-only lookup data needed by public Kiosks
// and authenticated staff.

sharedRouter.get('/departments', callerController.getDepartments);
sharedRouter.get('/queue-options', callerController.getQueueOptions);
sharedRouter.post('/queue-options/batch', callerController.getQueueOptionsByDepartment);

// ─── Analytics ─────────────────────────────────────────────────
sharedRouter.get('/analytics', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    try {
        const scope = (authReq.query.scope as AnalyticsScope) || 'all';
        const departmentId = authReq.query.departmentId as string | undefined;
        const fromDate = authReq.query.fromDate as string | undefined;
        const toDate = authReq.query.toDate as string | undefined;
        const userId = authReq.query.userId as string | undefined;

        const data = await getAnalytics({ scope, departmentId, fromDate, toDate, userId });
        res.status(200).json({ success: true, data });
    } catch (error: unknown) {
        logger.error('Failed to load analytics', {
            path: authReq.path,
            scope: authReq.query.scope,
            userId: authReq.user?.id,
            error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ success: false, error: 'Failed to load analytics' });
    }
}));
