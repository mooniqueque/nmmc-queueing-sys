import { NextFunction, Request, Response } from 'express';
import logger from '../lib/logger.js';

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

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';

    // Log error for internal monitoring using Winston
    if (statusCode >= 500) {
        logger.error(`Unhandled Server Error: ${err.message}`, {
            method: req.method,
            path: req.path,
            statusCode,
            stack: err.stack,
            userId: (req as any).user?.id
        });
    } else if (statusCode >= 400) {
        logger.warn(`Operational Error: ${err.message}`, {
            method: req.method,
            path: req.path,
            statusCode,
            userId: (req as any).user?.id
        });
    }

    res.status(statusCode).json({
        success: false,
        status,
        message: err.message || 'An unexpected error occurred',
        code: err.code || undefined,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        errors: err.errors || undefined
    });
};

/**
 * Utility to wrap async functions and catch errors to pass to global error handler
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
