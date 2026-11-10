import type { Request, Response } from 'express'
import { UserService } from '../services/user.service'
import { searchUsersSchema, type AdminUpdateUserInput } from '../validators/admin.schema'

export class AdminController {
    static async searchUsers(req: Request, res: Response) {
        const query = searchUsersSchema.safeParse(req.query);
        if (!query.success) {
            return res.status(422).json({ code: 'INVALID_QUERY' });
        }
        return res.status(200).json(await UserService.search(query.data));
    }

    static async restoreUser(req: Request<{ userId: string; }>, res: Response) {
        return res.status(200).json({ data: await UserService.restore(req.params.userId) });
    }

    static async updateUser(req: Request<{ userId: string; }, {}, AdminUpdateUserInput>, res: Response) {
        return res.status(200).json({
            data: await UserService.update(req.params.userId, req.body)
        });
    }
}
