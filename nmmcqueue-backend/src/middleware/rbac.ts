import { NextFunction, Request, Response } from 'express';
import { getVerifiedSessionUser, rejectInvalidSession } from '../modules/auth/session-guard.js';
import { AuthenticatedRequest } from './types.js';

const ROLE_CAPABILITIES: Record<string, string[]> = {
    ADMIN: [
        'TRIAGE_VIEW',
        'TRIAGE_MUTATE',
        'WINDOW_VIEW',
        'WINDOW_MUTATE',
        'CLINIC_VIEW',
        'CLINIC_MUTATE',
        'MONITOR_ADMIN',
        'QUEUE_ADMIN',
        'USER_ADMIN',
    ],
    TRIAGE_NURSE: ['TRIAGE_VIEW', 'TRIAGE_MUTATE'],
    WINDOW_CLERK: ['WINDOW_VIEW', 'WINDOW_MUTATE'],
    CLINIC_CALLER: ['CLINIC_VIEW', 'CLINIC_MUTATE'],
};

function hasCapability(role: string, capability: string) {
    return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await getVerifiedSessionUser(req);
        if (!user) {
            return res.status(401).json({ success: false, error: 'Authentication Required' });
        }
        (req as AuthenticatedRequest).user = user;
        next();
    } catch (error) {
        if (error instanceof Error && /inactive|authorized/i.test(error.message)) {
            return rejectInvalidSession(req, res);
        }
        res.status(500).json({ success: false, error: 'Authentication Processing Failed' });
    }
};

export const requireRole = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await getVerifiedSessionUser(req);
            if (!user) {
                return res.status(401).json({ success: false, error: 'Authentication Required' });
            }
            (req as AuthenticatedRequest).user = user;
            const userRole = user.role;
            if (userRole !== 'ADMIN' && !roles.includes(userRole)) {
                return res.status(403).json({ success: false, error: `Forbidden: role ${userRole} lacks permission` });
            }
            next();
        } catch (error) {
            if (error instanceof Error && /inactive|authorized/i.test(error.message)) {
                return rejectInvalidSession(req, res);
            }
            res.status(500).json({ success: false, error: 'Authorization Processing Failed' });
        }
    };
};

export const requireCapability = (capability: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await getVerifiedSessionUser(req);
            if (!user) {
                return res.status(401).json({ success: false, error: 'Authentication Required' });
            }

            (req as AuthenticatedRequest).user = user;
            if (!hasCapability(user.role, capability)) {
                return res.status(403).json({
                    success: false,
                    error: `Forbidden: capability ${capability} is required.`,
                });
            }

            next();
        } catch (error) {
            if (error instanceof Error && /inactive|authorized/i.test(error.message)) {
                return rejectInvalidSession(req, res);
            }
            res.status(500).json({ success: false, error: 'Authorization Processing Failed' });
        }
    };
};
