import type { ErrorRequestHandler } from 'express'
import { clearSessionCookie } from '../utils/session'

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);
    if (err.message === 'USER_DISABLED' || err.message === 'USER_DELETED') clearSessionCookie(res);

    return res.status(err.statusCode ?? 500).json({
        code: err.message ?? 'SERVER_ERROR'
    });
};