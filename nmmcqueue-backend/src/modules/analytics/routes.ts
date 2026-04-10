import { NextFunction, Response, Router } from 'express';
import logger from '../../lib/logger.js';
import { requireCapability } from '../../middleware/rbac.js';
import type { AuthenticatedRequest } from '../../middleware/types.js';
import { getClinicSnapshot, getTriageSnapshot, getWindowSnapshot } from './service.js';

export const analyticsRouter = Router();

analyticsRouter.get('/triage-snapshot', requireCapability('TRIAGE_VIEW'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const data = await getTriageSnapshot(req.query.date as string | undefined);
        res.status(200).json({ success: true, data });
    } catch (error: unknown) {
        logger.error('Failed to load triage snapshot', {
            path: req.path,
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error),
        });
        next(error);
    }
});

analyticsRouter.get('/window-snapshot', requireCapability('WINDOW_VIEW'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const data = await getWindowSnapshot(req.query.date as string | undefined);
        res.status(200).json({ success: true, data });
    } catch (error: unknown) {
        logger.error('Failed to load window snapshot', {
            path: req.path,
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error),
        });
        next(error);
    }
});

analyticsRouter.get('/clinic-snapshot', requireCapability('CLINIC_VIEW'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const data = await getClinicSnapshot(
            {
                id: req.user.id,
                role: req.user.role,
            },
            req.query.date as string | undefined,
            req.query.departmentId as string | undefined,
        );
        res.status(200).json({ success: true, data });
    } catch (error: unknown) {
        logger.error('Failed to load clinic snapshot', {
            path: req.path,
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error),
        });
        next(error);
    }
});
