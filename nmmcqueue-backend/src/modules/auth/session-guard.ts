import { fromNodeHeaders } from 'better-auth/node';
import type { Request, Response } from 'express';

import { authCookieHttpOnly, authCookieSameSite, authCookieSecure } from '../../config/auth-cookie.js';
import { db } from '../../config/database.js';
import { auth } from './auth.js';

import { SessionUser, UserRole } from '@nmmc/types';

function clearSessionCookies(req: Request, res: Response) {
    res.setHeader('Clear-Site-Data', '"cookies"');

    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return;

    const cookieNames = cookieHeader
        .split(';')
        .map((chunk) => chunk.trim().split('=')[0])
        .filter((name) => /better-auth|session/i.test(name));

    for (const cookieName of new Set(cookieNames)) {
        res.clearCookie(cookieName, {
            httpOnly: authCookieHttpOnly,
            sameSite: authCookieSameSite,
            secure: authCookieSecure,
        });
    }
}

export async function getVerifiedSessionUser(req: Request): Promise<SessionUser | null> {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session?.user?.id) {
        return null;
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            role: true,
            isActive: true,
            firstName: true,
            lastName: true,
            middleName: true,
            suffix: true,
            email: true,
            employeeID: true,
            department: true,
            departmentId: true,
            workstationId: true,
            image: true,
            name: true,
            username: true,
            displayUsername: true,
        },
    });

    if (!user) {
        return null;
    }

    if (!user.isActive) {
        throw new Error('Account is inactive or no longer authorized');
    }

    return {
        ...user,
        role: user.role as UserRole,
    };
}

export function rejectInvalidSession(req: Request, res: Response) {
    clearSessionCookies(req, res);
    return res.status(403).json({
        success: false,
        error: 'Forbidden: account is inactive or no longer authorized.',
        clearSession: true,
    });
}
