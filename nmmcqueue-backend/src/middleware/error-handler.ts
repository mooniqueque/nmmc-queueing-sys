import { NextFunction, Request, Response } from 'express';
import logger from '../lib/logger.js';
import type { AuthenticatedRequest } from './types.js';

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code?: string;

    constructor(message: string, statusCode: number = 500, code?: string, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

function getRequestUserId(req: Request) {
    const authReq = req as Partial<AuthenticatedRequest>;
    return authReq.user?.id;
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    const isDevelopment = process.env.NODE_ENV === 'development';
    const userId = getRequestUserId(req);

    // Log error for internal monitoring using Winston
    if (statusCode >= 500) {
        logger.error(`Unhandled Server Error: ${err.message}`, {
            method: req.method,
            path: req.path,
            statusCode,
            stack: err.stack,
            userId,
        });
    } else if (statusCode >= 400) {
        logger.warn(`Operational Error: ${err.message}`, {
            method: req.method,
            path: req.path,
            statusCode,
            userId,
        });
    }

    const publicMessage = statusCode >= 500
        ? 'Internal server error'
        : (err.message || 'Request failed');

    res.status(statusCode).json({
        success: false,
        status,
        message: publicMessage,
        code: err.code || undefined,
        ...(isDevelopment && { stack: err.stack }),
        errors: err.errors || undefined
    });
};

/**
 * Utility to wrap async functions and catch errors to pass to global error handler
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
