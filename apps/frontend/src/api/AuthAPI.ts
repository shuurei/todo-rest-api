import type { ApiResponse } from '@/types/api'
import type { User } from '@/types/user'
import { api } from '@/utils/axios'

export interface RegisterPayload {
    username: string;
    password: string;
}

export interface LoginPayload {
    username: string;
    password: string;
}

export interface LoginResponseData {
    user: User;
}

export class AuthAPI {
    static get api() {
        return api;
    }

    static async check(signal?: AbortSignal) {
        return await api.get<ApiResponse<User>>('/users/@me', { signal });
    }

    static async register(payload: RegisterPayload) {
        return await api.post<ApiResponse<LoginResponseData>>('/auth/register', payload);
    }

    static async login(payload: LoginPayload) {
        return await api.post<ApiResponse<LoginResponseData>>('/auth/login', payload);
    }

    static async logout() {
        return await api.post<ApiResponse<User>>('/auth/logout');
    }
}