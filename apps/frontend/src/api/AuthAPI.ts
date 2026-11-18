import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/user';
import { api } from '@/utils/axios';
import { Gateway as gateway } from '@/utils/gateway';
import type { GatewaySession } from '@nodus/shared';

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

    private static async authenticate(type: 'login' | 'register', payload: LoginPayload) {
        const [result] = await Promise.allSettled([
            api.post<ApiResponse<LoginResponseData>>(`/auth/${type}`, payload),
            new Promise<void>((resolve) => setTimeout(resolve, 3000))
        ]);

        if (result.status === 'rejected') {
            throw result.reason;
        }

        gateway.reconnect();

        return result.value;
    }

    static async register(payload: RegisterPayload) {
        return this.authenticate('register', payload);
    }

    static async login(payload: LoginPayload) {
        return this.authenticate('login', payload);
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

        gateway.reconnect('logout');

        return result;
    }
}
