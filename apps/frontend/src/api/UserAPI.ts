import { api } from '@/utils/axios'
import type { ApiResponse } from '@/types/api'
import type { User } from '@/types/user'
import type { UserPreferences } from '@todo/shared'

export class UserAPI {
    static get api() {
        return api;
    };

    static async deleteAccount() {
        return await api.delete('/users/@me');
    }

    static async getById(userId: string) {
        return await api.get<ApiResponse<User>>(`/users/${userId}`);
    }

    static async updatePreferences(payload: Partial<UserPreferences>) {
        return await api.patch<ApiResponse<UserPreferences>>('/users/@me/preferences', payload);
    }

    static async update(userId: string, payload: Partial<User>) {
        return await api.patch<ApiResponse<User>>(`/users/${userId}`, payload);
    }
}