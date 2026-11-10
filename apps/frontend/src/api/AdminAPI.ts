import { api } from '@/utils/axios'
import type { ApiResponse } from '@/types/api'
import type { User } from '@/types/user'

export type AdminUserUpdate = Partial<Pick<User, 'username' | 'displayName' | 'flags' | 'isDisabled'>>;
export type UserStatus = 'all' | 'active' | 'disabled' | 'deleted';

export interface UserSearchResponse extends ApiResponse<User[]> {
    meta: { page: number; limit: number; total: number; totalPages: number };
}

export class AdminAPI {
    static async searchUsers(q: string, page: number, status: UserStatus = 'all', signal?: AbortSignal) {
        return await api.get<UserSearchResponse>('/admin/users', {
            params: { q, page, status, limit: 20 }, signal,
        });
    }

    static async updateUser(userId: string, payload: AdminUserUpdate) {
        return await api.patch<ApiResponse<User>>(`/admin/users/${encodeURIComponent(String(userId))}`, payload);
    }

    static async restoreUser(userId: string) {
        return await api.post<ApiResponse<User>>(`/admin/users/${encodeURIComponent(String(userId))}/restore`);
    }

    static async deleteUser(userId: string) {
        return await api.delete(`/admin/users/${encodeURIComponent(String(userId))}`);
    }
}
