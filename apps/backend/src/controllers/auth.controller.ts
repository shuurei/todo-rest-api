import z from 'zod';
import { Request, Response } from 'express';
import { isIP } from 'node:net';
import { HttpNotFoundError } from '../utils/http-errors';
import { AuthService } from '../services/auth.service';
import { clearSessionCookie, sendSessionResponse } from '../utils/session';
import { CreateUserInput } from '../validators/user.schema';
import { LoginInput } from '../validators/auth.schema';

const getClientIp = (req: Request) => {
    const address = (req.ip ?? req.socket.remoteAddress ?? '').replace(/^::ffff:/, '');

    return isIP(address) ? address : null;
};

export class AuthController {
    static async register(req: Request<{}, {}, CreateUserInput>, res: Response) {
        return sendSessionResponse(
            req,
            res,
            await AuthService.register(req.body, req.headers['user-agent'] ?? null, getClientIp(req)),
            201
        );
    }

    static async login(req: Request<{}, {}, LoginInput>, res: Response) {
        const { username, password } = req.body;

        return sendSessionResponse(
            req,
            res,
            await AuthService.login(username, password, req.headers['user-agent'] ?? null, getClientIp(req))
        );
    }

    static async listSessions(req: Request, res: Response) {
        return res.json({
            data: await AuthService.listSessions(req.userId, req.sessionId)
        });
    }

    static async revokeSession(
        req: Request<{
            sessionId: string;
        }>,
        res: Response
    ) {
        if (!z.uuid().safeParse(req.params.sessionId).success) {
            throw new HttpNotFoundError('SESSION_NOT_FOUND');
        }

        await AuthService.revokeSession(req.userId, req.params.sessionId);

        if (req.params.sessionId === req.sessionId) {
            clearSessionCookie(res);
        }

        return res.sendStatus(204);
    }

    static async revokeAllSessions(req: Request, res: Response) {
        await AuthService.revokeAllSessions(req.userId);

        clearSessionCookie(res);

        return res.sendStatus(204);
    }

    static async logout(req: Request, res: Response) {
        await AuthService.logout(req.userId, req.sessionId);

        clearSessionCookie(res);

        return res.sendStatus(204);
    }
}
