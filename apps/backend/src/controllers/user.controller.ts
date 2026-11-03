import type { Request, Response } from 'express'
import { UserService } from '../services/user.service'
import { UpdateUserInput } from '../validators/user.schema'
import { HttpForbiddenError } from '../utils/http-errors'

export class UserController {
    static async show(req: Request<{ userId: string; }>, res: Response) {
        return res.status(200).json({
            data: await UserService.findById(req.params.userId)
        });
    }

    static async update(req: Request<{ userId: string; }, {}, UpdateUserInput>, res: Response) {
        if (req.userId != req.params.userId) {
            throw new HttpForbiddenError();
        }

        return res.status(200).json({
            data: await UserService.update(req.params.userId, req.body)
        });
    }

    static async remove(req: Request<{ userId: string; }>, res: Response) {
        if (req.userId != req.params.userId) {
            throw new HttpForbiddenError();
        }

        await UserService.delete(req.params.userId);

        return res.sendStatus(204);
    }
}