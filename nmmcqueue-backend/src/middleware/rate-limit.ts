import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter.
 * Increased limits to accommodate active dashboard usage.
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 1000, 
    standardHeaders: 'draft-6',
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many requests, please try again later.'
    }
});

/**
 * Stricter limiter for public submission endpoints like Kiosk registration.
 */
export const kioskLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 50, 
    standardHeaders: 'draft-6',
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many registrations from this IP, please try again later.'
    }
});

/**
 * Strict limiter for authentication attempts.
 * Lenient enough for development but prevents brute force.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, 
    standardHeaders: 'draft-6',
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many login attempts, please try again after 15 minutes'
    }
});
