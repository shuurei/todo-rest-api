import type { Request, Response } from 'express'
import { UserService } from '../services/user.service'
import { UpdateUserInput } from '../validators/user.schema'
import type { UpdateUserPreferencesInput } from '../validators/user-preferences.schema'
import { clearSessionCookie } from '../utils/session'

export class UserController {
    static async show(req: Request<{ userId: string; }>, res: Response) {
        return res.status(200).json({
            data: await UserService.findById(req.params.userId)
        });
    }

    static async update(req: Request<{ userId: string; }, {}, UpdateUserInput>, res: Response) {
        return res.status(200).json({
            data: await UserService.update(req.params.userId, req.body)
        });
    }

    static async updatePreferences(req: Request<{ userId: string; }, {}, UpdateUserPreferencesInput>, res: Response) {
        return res.status(200).json({
            data: await UserService.updatePreferences(req.params.userId, req.body)
        });
    }

    static async remove(req: Request<{ userId: string; }>, res: Response) {
        await UserService.delete(req.params.userId);

        if (req.userId === req.params.userId) {
            clearSessionCookie(res);
        }
        
        return res.sendStatus(204);
    }
}