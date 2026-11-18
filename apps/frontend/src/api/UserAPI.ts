import { api } from '@/utils/axios';
import { Gateway as gateway } from '@/utils/gateway';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/user';
import { homeWallpaperFields, type HomeWallpaperField, type UserPreferences } from '@nodus/shared';

export class UserAPI {
    static get api() {
        return api;
    }

    static async deleteAccount() {
        const result = await api.delete('/users/@me');

        gateway.reconnect();

        return result;
    }

    static async getById(userId: string) {
        return await api.get<ApiResponse<User>>(`/users/${userId}`);
    }

    static async updatePreferences(payload: Partial<UserPreferences>, wallpapers?: Partial<Record<HomeWallpaperField, File | null>>) {
        if (wallpapers && homeWallpaperFields.some((field) => wallpapers[field])) {
            const formData = new FormData();

            formData.set('preferences', JSON.stringify(payload));

            for (const field of homeWallpaperFields) {
                const file = wallpapers[field];
                if (file) formData.set(field, file);
            }

            return await api.patch<ApiResponse<UserPreferences>>('/users/@me/preferences', formData, {
                headers: {
                    'Content-Type': undefined
                },
                timeout: 60000
            });
        }

        return await api.patch<ApiResponse<UserPreferences>>('/users/@me/preferences', payload);
    }

    static async update(userId: string, payload: Partial<User>) {
        return await api.patch<ApiResponse<User>>(`/users/${userId}`, payload);
    }
}
