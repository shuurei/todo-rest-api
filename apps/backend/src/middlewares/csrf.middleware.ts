import 'dotenv/config'

import type { Request, Response, NextFunction } from 'express'
import { HttpForbiddenError } from '../utils/http-errors'
import { SESSION_COOKIE } from '../utils/session'

const defaultOrigins = process.env.NODE_ENV === 'DEV'
    ? 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173'
    : '';

// Exact origins shared by CORS and CSRF; no wildcard or suffix matching.
export const allowedOrigins = [...new Set(
    (process.env.WEB_ORIGINS ?? defaultOrigins)
        .split(',')
        .map(origin => origin.trim())
        .filter(origin => origin !== '' && origin !== '*' && origin !== 'null'),
)];

export function csrfMiddleware(req: Request, _res: Response, next: NextFunction) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

    const authEndpoint = req.path === '/auth/login' || req.path === '/auth/register';
    if (authEndpoint) {
        const mode = req.get('X-Auth-Mode');
        if (mode && mode !== 'cookie' && mode !== 'bearer') {
            throw new HttpForbiddenError('INVALID_AUTH_MODE');
        }

        if (req.get('X-Auth-Mode') === 'bearer') {
            if (req.get('Origin') !== undefined || req.get('sec-fetch-site') !== undefined) {
                throw new HttpForbiddenError('NATIVE_CLIENT_REQUIRED');
            }

            return next();
        }
    }

    if (req.cookies?.[SESSION_COOKIE] !== undefined || authEndpoint) {
        const origin = req.get('Origin');
        if (!origin) {
            throw new HttpForbiddenError('ORIGIN_REQUIRED');
        }
        if (!allowedOrigins.includes(origin)) {
            throw new HttpForbiddenError('ORIGIN_NOT_ALLOWED');
        }
    }
    
    return next();
}
