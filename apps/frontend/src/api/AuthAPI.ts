import type { ApiResponse } from '@/types/api'
import type { User } from '@/types/user'
import { api } from '@/utils/axios'

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponseData {
    token: string;
    user: User;
}

export class AuthAPI {
    static get api() {
        return api;
    }

    static async register(payload: RegisterPayload) {
        return await api.post<ApiResponse<User>>('/auth/register', payload);
    }

    static async login(payload: LoginPayload) {
        return await api.post<ApiResponse<LoginResponseData>>('/auth/login', payload);
    }

    static async logout() {
        return await api.post<ApiResponse<User>>('/auth/logout');
    }
}