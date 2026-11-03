import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { HttpUnauthorizedError } from '../utils/http-errors'
import { AuthService } from '../services/auth.service'

const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthRequest extends Request {
    userId?: string;
    token?: string;
}

export const authMiddleware = async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw new HttpUnauthorizedError('TOKEN_MISSING');
    }

    const token = authHeader.split(' ')[1];

    const payload = jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            throw new HttpUnauthorizedError('INVALID_TOKEN');
        }

        return decoded;
    }) as unknown as jwt.JwtPayload;

    if (typeof payload === 'string' || !payload.userId) {
        throw new HttpUnauthorizedError('INVALID_TOKEN');
    }

    const session = await AuthService.repo.findOneBy({ userId: payload.userId, token });
    if (!session || session.expiresAt <= new Date()) {
        throw new HttpUnauthorizedError('SESSION_EXPIRED');
    }

    req.userId = payload.userId;
    req.token = payload.token;

    return next()
}