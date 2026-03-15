import { fromNodeHeaders } from 'better-auth/node';
import { NextFunction, Request, Response } from 'express';
import { auth } from '../modules/auth/auth.js';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
        if (!session || !session.user) {
            return res.status(401).json({ success: false, error: 'Authentication Required' });
        }
        if ((session.user as any).isApproved === false) {
            return res.status(403).json({ success: false, error: 'Account pending administrative approval.' });
        }
        (req as any).user = session.user;
        next();
    } catch {
        res.status(500).json({ success: false, error: 'Authentication Processing Failed' });
    }
};

export const requireRole = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
            if (!session || !session.user) {
                return res.status(401).json({ success: false, error: 'Authentication Required' });
            }
            (req as any).user = session.user;
            const userRole = (session.user as any).role;
            if (userRole !== 'ADMIN' && !roles.includes(userRole)) {
                return res.status(403).json({ success: false, error: `Forbidden: role ${userRole} lacks permission` });
            }
            next();
        } catch {
            res.status(500).json({ success: false, error: 'Authorization Processing Failed' });
        }
    };
};
