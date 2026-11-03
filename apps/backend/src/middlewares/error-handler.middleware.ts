import type { ErrorRequestHandler } from 'express'

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);

    return res.status(err.statusCode ?? 500).json({
        code: err.message ?? 'SERVER_ERROR'
    });
};