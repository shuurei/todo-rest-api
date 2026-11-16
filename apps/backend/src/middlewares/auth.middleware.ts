import type { Request, Response, NextFunction } from 'express';
import { HttpUnauthorizedError } from '../utils/http-errors';
import { authenticateSession } from '../utils/authenticate-session';
import { SESSION_COOKIE, clearSessionCookie } from '../utils/session';

export interface AuthRequest extends Request {
    userId?: string;
    sessionId?: string;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'no-store');

    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.[SESSION_COOKIE];
    const token = cookieToken ?? (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined);

    if (!token || typeof token !== 'string') {
        if (cookieToken !== undefined) {
            clearSessionCookie(res);
        }

        throw new HttpUnauthorizedError('TOKEN_MISSING');
    }

    try {
        const { user, session } = await authenticateSession(token);

        req.userId = user.id;

        req.sessionId = session.id;

        return next();
    } catch (error) {
        if (cookieToken && [401, 403].includes(error.statusCode)) {
            clearSessionCookie(res);
        }

        throw error;
    }
};
