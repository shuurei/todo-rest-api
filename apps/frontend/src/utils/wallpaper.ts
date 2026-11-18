import { isHomeWallpaperId } from '@nodus/shared';
import { api } from '@/utils/axios';

export const maxWallpaperBytes = 10 * 1024 * 1024;

export function getWallpaperUrl(id: string | null): string | null {
    if (!isHomeWallpaperId(id)) {
        return null;
    }

    const base = new URL(api.defaults.baseURL ?? '/api', window.location.href);

    return new URL(`/public/images/${id}.jpg`, base.origin).href;
}
