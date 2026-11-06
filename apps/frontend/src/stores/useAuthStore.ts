import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/user'

interface AuthState {
    user: User | null;
    token: string | null;
    setToken: (token: string | null) => void;
    setUser: (payload: User | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(persist((set) => ({
    user: null,
    token: null,
    setToken: (token) => set({ token }),
    setUser: (user) => set({ user }),
    logout: () => set({ user: null, token: null })
}), { name: 'auth-storage' }));