import { api } from '@/utils/axios';
import { Gateway as gateway } from '@/utils/gateway';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/user';
import type { UserPreferences } from '@todo/shared';

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

    static async updatePreferences(payload: Partial<UserPreferences>, wallpaper?: File | null) {
        if (wallpaper) {
            const formData = new FormData();

            formData.set('preferences', JSON.stringify(payload));

            formData.set('homeWallpaper', wallpaper);

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
