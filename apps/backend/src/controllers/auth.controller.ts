import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'

import { CreateUserInput } from '../validators/user.schema'
import { LoginInput } from '../validators/auth.schema'

export class AuthController {
    static async register(req: Request<{}, {}, CreateUserInput>, res: Response) {
        return res.status(201).json({
            data: await AuthService.register(req.body)
        });
    }

    static async login(req: Request<{}, {}, LoginInput>, res: Response) {
        const { email, password } = req.body;

        return res.status(200).json({
            data: await AuthService.login(email, password, req.headers['user-agent'] ?? null)
        });
    }

    static async logout(req: Request, res: Response) {
        await AuthService.logout(req.userId, req.token);

        return res.sendStatus(204);
    }
}