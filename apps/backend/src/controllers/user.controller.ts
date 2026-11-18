import type { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { UpdateUserInput } from '../validators/user.schema';
import type { UpdateUserPreferencesInput } from '../validators/user-preferences.schema';
import { clearSessionCookie } from '../utils/session';
import { storeImage, removeImage, imageExists } from '../utils/image';
import { homeWallpaperFields } from '@nodus/shared';

export class UserController {
    static async show(
        req: Request<{
            userId: string;
        }>,
        res: Response
    ) {
        return res.status(200).json({
            data: await UserService.findById(req.params.userId)
        });
    }

    static async update(
        req: Request<
            {
                userId: string;
            },
            {},
            UpdateUserInput
        >,
        res: Response
    ) {
        return res.status(200).json({
            data: await UserService.update(req.params.userId, req.body)
        });
    }

    static async updatePreferences(
        req: Request<
            {
                userId: string;
            },
            {},
            UpdateUserPreferencesInput
        >,
        res: Response
    ) {
        const uploadedIds: string[] = [];

        try {
            const files = req.files && !Array.isArray(req.files) ? req.files : {};
            for (const field of homeWallpaperFields) {
                const file = files[field]?.[0];
                if (file) {
                    const id = await storeImage(file.buffer);
                    uploadedIds.push(id);
                    req.body[field] = id;
                } else if (req.body[field]) {
                    await imageExists(req.body[field]);
                }
            }

            return res.status(200).json({
                data: await UserService.updatePreferences(req.params.userId, req.body)
            });
        } catch (error) {
            await Promise.all(uploadedIds.map((id) => removeImage(id).catch(console.error)));

            throw error;
        }
    }

    static async remove(
        req: Request<{
            userId: string;
        }>,
        res: Response
    ) {
        await UserService.delete(req.params.userId);

        if (req.userId === req.params.userId) {
            clearSessionCookie(res);
        }

        return res.sendStatus(204);
    }
}
