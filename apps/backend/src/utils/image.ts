import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { isHomeWallpaperId } from '@nodus/shared';

export const imageDirectory = fileURLToPath(new URL('../../uploads/images/', import.meta.url));

export const maxImageBytes = 10 * 1024 * 1024;

const imageError = (code: string, statusCode: number) => {
    return Object.assign(new Error(code), {
        statusCode
    });
};

export const encodeImage = async (buffer: Buffer) => {
    let image: Buffer;

    try {
        const input = sharp(buffer, {
            page: 0,
            pages: 1,
            limitInputPixels: 40_000_000
        });
        const metadata = await input.metadata();

        if (!['jpeg', 'png', 'webp', 'gif'].includes(metadata.format)) {
            throw new Error();
        }

        image = await input
            .rotate()
            .flatten({
                background: '#ffffff'
            })
            .jpeg({
                quality: 95,
                chromaSubsampling: '4:4:4',
                mozjpeg: true
            })
            .toBuffer();
    } catch {
        throw imageError('INVALID_WALLPAPER', 422);
    }

    if (image.length > maxImageBytes) {
        throw imageError('WALLPAPER_TOO_LARGE', 413);
    }

    return image;
};

export const storeImage = async (buffer: Buffer) => {
    const image = await encodeImage(buffer);
    const id = randomUUID();

    await mkdir(imageDirectory, {
        recursive: true
    });

    await writeFile(path.join(imageDirectory, `${id}.jpg`), image, {
        flag: 'wx'
    });

    return id;
};

export const removeImage = async (id: string) => {
    if (isHomeWallpaperId(id)) {
        await unlink(path.join(imageDirectory, `${id}.jpg`));
    }
};

export const imageExists = async (id: string) => {
    if (!isHomeWallpaperId(id)) {
        throw imageError('INVALID_WALLPAPER', 422);
    }

    try {
        await access(path.join(imageDirectory, `${id}.jpg`));
    } catch {
        throw imageError('INVALID_WALLPAPER', 422);
    }
};
