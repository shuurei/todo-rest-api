import { create } from 'zustand'
import { persist } from 'zustand/middleware';

interface AppSettings {
    transitionDuration: number;
}

interface AppState {
    settings: AppSettings;
    setSetting: (key: string, value: any) => void;
    resetDefault: () => void;
}

export const useAppStore = create<AppState>()(persist((set) => ({
    settings: {
        transitionDuration: 2.2
    },
    setSetting: (key, value) => set((state) => ({
        settings: {
            ...state.settings,
            [key]: value
        }
    })),
    resetDefault: () => set({
        settings: {
            transitionDuration: 2.2
        }
    })
}), { name: 'app-storage' }));