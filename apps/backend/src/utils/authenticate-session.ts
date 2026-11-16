import jwt from 'jsonwebtoken';
import z from 'zod';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { HttpForbiddenError, HttpUnauthorizedError } from './http-errors';

export async function authenticateSession(token: string) {
    let payload: string | jwt.JwtPayload;

    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        throw new HttpUnauthorizedError(err instanceof jwt.TokenExpiredError ? 'SESSION_EXPIRED' : 'INVALID_TOKEN');
    }

    if (typeof payload === 'string' || !payload.userId) {
        throw new HttpUnauthorizedError('INVALID_TOKEN');
    }

    if (!payload.jti) {
        throw new HttpUnauthorizedError('SESSION_EXPIRED');
    }

    if (!z.uuid().safeParse(payload.jti).success) {
        throw new HttpUnauthorizedError('INVALID_TOKEN');
    }

    const user = await UserService.findForAuthentication(payload.userId);

    if (!user) {
        throw new HttpUnauthorizedError('SESSION_EXPIRED');
    }

    if (user.isDisabled) {
        throw new HttpForbiddenError('USER_DISABLED');
    }

    const session = await AuthService.findSession(payload.userId, payload.jti, token);

    if (!session || session.expiresAt <= new Date()) {
        throw new HttpUnauthorizedError('SESSION_EXPIRED');
    }

    return { user, session };
}
