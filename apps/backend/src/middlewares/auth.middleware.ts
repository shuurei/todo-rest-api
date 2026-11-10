import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import z from 'zod'

import { HttpUnauthorizedError } from '../utils/http-errors'
import { AuthService } from '../services/auth.service'
import { UserService } from '../services/user.service'
import { SESSION_COOKIE, clearSessionCookie } from '../utils/session'

const JWT_SECRET = process.env.JWT_SECRET;

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
        if (cookieToken !== undefined) clearSessionCookie(res);
        throw new HttpUnauthorizedError('TOKEN_MISSING');
    }

    let payload: string | jwt.JwtPayload;
    try {
        payload = jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (cookieToken) clearSessionCookie(res);
        if (error instanceof jwt.TokenExpiredError) {
            throw new HttpUnauthorizedError('SESSION_EXPIRED');
        }

        throw new HttpUnauthorizedError('INVALID_TOKEN');
    }

    if (typeof payload === 'string' || !payload.userId) {
        if (cookieToken) clearSessionCookie(res);
        throw new HttpUnauthorizedError('INVALID_TOKEN');
    }

    if (!payload.jti) {
        if (cookieToken) clearSessionCookie(res);
        throw new HttpUnauthorizedError('SESSION_EXPIRED');
    }
    
    if (!z.uuid().safeParse(payload.jti).success) {
        if (cookieToken) clearSessionCookie(res);
        throw new HttpUnauthorizedError('INVALID_TOKEN');
    }

    const user = await UserService.findForAuthentication(payload.userId);
    if (!user) {
        if (cookieToken) clearSessionCookie(res);
        throw new HttpUnauthorizedError('SESSION_EXPIRED');
    }
    
    UserService.assertCanAuthenticate(user);

    const session = await AuthService.findSession(payload.userId, payload.jti, token);
    if (!session || session.expiresAt <= new Date()) {
        if (cookieToken) clearSessionCookie(res);
        throw new HttpUnauthorizedError('SESSION_EXPIRED');
    }

    req.userId = payload.userId;
    req.sessionId = session.id;

    return next();
}