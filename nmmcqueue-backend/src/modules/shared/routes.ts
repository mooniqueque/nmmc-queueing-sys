import { Request, Response, Router } from 'express';
import { requireAuth } from '../../middleware/rbac.js';
import { callerController } from '../caller/controller.js';
import { getAnalytics, AnalyticsScope } from './analytics.js';

export const sharedRouter = Router();

// ─── Public Reference Data ─────────────────────────────────────
// These endpoints serve read-only lookup data needed by public Kiosks
// and authenticated staff.

sharedRouter.get('/departments', callerController.getDepartments);
sharedRouter.get('/queue-options', callerController.getQueueOptions);
sharedRouter.post('/queue-options/batch', callerController.getQueueOptionsByDepartment);

// ─── Analytics ─────────────────────────────────────────────────
sharedRouter.get('/analytics', requireAuth, async (req: Request, res: Response) => {
    try {
        const scope = (req.query.scope as AnalyticsScope) || 'all';
        const departmentId = req.query.departmentId as string | undefined;
        const fromDate = req.query.fromDate as string | undefined;
        const toDate = req.query.toDate as string | undefined;
        const userId = req.query.userId as string | undefined;

        const data = await getAnalytics({ scope, departmentId, fromDate, toDate, userId });
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});
