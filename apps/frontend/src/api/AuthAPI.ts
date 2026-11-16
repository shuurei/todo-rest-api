import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/user';
import { api } from '@/utils/axios';
import { Gateway as gateway } from '@/utils/gateway';
import type { GatewaySession } from '@todo/shared';

export type UserSession = GatewaySession;

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

    static async register(payload: RegisterPayload) {
        const result = await api.post<ApiResponse<LoginResponseData>>('/auth/register', payload);

        gateway.reconnect();

        return result;
    }

    static async login(payload: LoginPayload) {
        const result = await api.post<ApiResponse<LoginResponseData>>('/auth/login', payload);

        gateway.reconnect();

        return result;
    }

    static async getSessions(signal?: AbortSignal) {
        return await api.get<ApiResponse<UserSession[]>>('/auth/sessions', {
            signal
        });
    }

    static async revokeSession(sessionId: string) {
        return await api.delete(`/auth/sessions/${encodeURIComponent(sessionId)}`);
    }

    static async revokeAllSessions() {
        const result = await api.delete('/auth/sessions');

        gateway.reconnect();

        return result;
    }

    static async logout() {
        const result = await api.post<ApiResponse<User>>('/auth/logout');

        gateway.reconnect();

        return result;
    }
}
