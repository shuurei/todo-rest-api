import { rateLimit } from 'express-rate-limit'

export const apiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'RATE_LIMIT_EXCEEDED' },
});

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 8,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { message: 'AUTH_RATE_LIMIT_EXCEEDED' },
});
