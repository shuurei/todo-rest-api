import { api } from '@/utils/axios'
import type { ApiResponse } from '@/types/api'
import type { User } from '@/types/user'

export class UserAPI {
    static get api() {
        return api;
    };

    static async getById(userId: string) {
        return await api.get<ApiResponse<User>>(`/users/${userId}`);
    }

    static async update(userId: string, payload: Partial<User>) {
        return await api.patch<ApiResponse<User>>(`/users/${userId}`, payload);
    }
}