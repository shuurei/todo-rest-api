import { create } from 'zustand'

import { AuthAPI, type LoginPayload } from '@/api/AuthAPI'
import type { User } from '@/types/user'

interface AuthState {
    user: User | null;
    token: string | null;
    login: (payload: LoginPayload) => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    login: async (payload) => {
        const { data } = await AuthAPI.login(payload);
        
        set({
            user: data.user,
            token: data.token
        });
    },
    logout: () => {
        set({ user: null, token: null })
    }
}));