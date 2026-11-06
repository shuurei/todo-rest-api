import { useAuthStore } from '@/stores/useAuthStore';
import { createContext, useContext, useMemo, useState } from 'react'
import { LuCheck, LuSlidersHorizontal, LuUser } from 'react-icons/lu'

export interface MiniApp {
    name: string;
    path: string;
    icon: React.ReactNode;
}

export interface MiniAppOrigin {
    x: number;
    y: number;
}

export interface MiniAppState extends MiniApp {
    origin: MiniAppOrigin;
    isOpen: boolean;
}

export interface MiniAppContextType {
    apps: MiniApp[];
    miniAppState: MiniAppState | null;
    openMiniApp: (app: Omit<MiniAppState, 'isOpen' | 'origin'> & { origin?: MiniAppOrigin }) => void;
    updateMiniAppOrigin: (origin: MiniAppOrigin) => void;
    closeMiniApp: () => void;
    clearMiniApp: () => void;
}

const MiniAppContext = createContext<MiniAppContextType | null>(null);

export const MiniAppProvider = ({ children }: { children: React.ReactNode }) => {
    const [miniAppState, setMiniAppState] = useState<MiniAppState | null>(null);
    const username = useAuthStore((state) => state.user?.username);

    const apps = useMemo<MiniApp[]>(() => [
        {
            name: 'Todos',
            path: '/todos',
            icon: <LuCheck />
        },
        {
            name: username ?? 'Account',
            path: '/account',
            icon: <LuUser />
        },
        {
            name: 'Settings',
            path: '/settings',
            icon: <LuSlidersHorizontal />
        },
    ], [username]);

    const value = useMemo(() => ({
        apps,
        miniAppState,
        openMiniApp: (app: Omit<MiniAppState, 'isOpen' | 'origin'> & { origin?: MiniAppOrigin }) => {
            if (miniAppState) return;

            app.origin ??= { x: 0, y: 0 }

            setMiniAppState({ ...app, isOpen: true } as MiniAppState)
        },
        updateMiniAppOrigin: ({ x, y }: MiniAppOrigin) => {
            setMiniAppState((app) => app && ({ ...app, origin: { x, y } }));
        },
        closeMiniApp: () => setMiniAppState((prev) => prev && ({ ...prev, isOpen: false })),
        clearMiniApp: () => setMiniAppState(null)
    }), [apps, miniAppState]);

    return (
        <MiniAppContext.Provider value={value}>
            {children}
        </MiniAppContext.Provider>
    );
};

export const useMiniApp = () => {
    const context = useContext(MiniAppContext);

    if (!context) {
        throw new Error('useMiniApp must be used within a MiniAppProvider');
    }

    return context;
};
