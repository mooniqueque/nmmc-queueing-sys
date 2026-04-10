import type { Request } from 'express';
import type { SessionUser } from '@nmmc/types';

/**
 * Express Request with a verified, typed `user` property.
 * Use this in controllers and route handlers after `requireAuth` or `requireRole` middleware.
 */
export interface AuthenticatedRequest extends Request {
    user: SessionUser;
}
