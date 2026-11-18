import multer from 'multer';
import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { maxImageBytes } from '../utils/image';
import { homeWallpaperFields } from '@nodus/shared';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: maxImageBytes,
        files: homeWallpaperFields.length,
        fields: 1,
        fieldSize: 16 * 1024,
        parts: homeWallpaperFields.length + 1
    }
}).fields(homeWallpaperFields.map((name) => ({ name, maxCount: 1 })));
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    keyGenerator: (req) => String(req.userId),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        code: 'TOO_MANY_REQUESTS'
    }
});

export const preferencesUploadLimiter: RequestHandler = (req, res, next) => {
    if (req.is('multipart/form-data')) {
        return limiter(req, res, next);
    }

    return next();
};

export const parsePreferencesUpload: RequestHandler = (req, res, next) => {
    if (!req.is('multipart/form-data')) {
        return next();
    }

    return upload(req, res, (error) => {
        if (error) {
            return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 422).json({
                code: error.code === 'LIMIT_FILE_SIZE' ? 'WALLPAPER_TOO_LARGE' : 'INVALID_WALLPAPER'
            });
        }

        try {
            if (typeof req.body?.preferences !== 'string') {
                throw new Error();
            }

            req.body = JSON.parse(req.body.preferences);

            if (req.files && req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
                for (const field of homeWallpaperFields) {
                    if (!Array.isArray(req.files) && req.files[field]?.length) req.body[field] = null;
                }
            }

            return next();
        } catch {
            return res.status(422).json({
                code: 'INVALID_PREFERENCES'
            });
        }
    });
};
