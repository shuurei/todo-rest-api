import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'
import { clearSessionCookie, sendSessionResponse } from '../utils/session'

import { CreateUserInput } from '../validators/user.schema'
import { LoginInput } from '../validators/auth.schema'

export class AuthController {
    static async register(req: Request<{}, {}, CreateUserInput>, res: Response) {
        return sendSessionResponse(
            req,
            res,
            await AuthService.register(req.body, req.headers['user-agent'] ?? null),
            201
        );
    }

    static async login(req: Request<{}, {}, LoginInput>, res: Response) {
        const { username, password } = req.body;

        return sendSessionResponse(
            req,
            res,
            await AuthService.login(username, password, req.headers['user-agent'] ?? null)
        );
    }

    static async logout(req: Request, res: Response) {
        await AuthService.logout(req.userId, req.sessionId);

        clearSessionCookie(res);
        
        return res.sendStatus(204);
    }
}