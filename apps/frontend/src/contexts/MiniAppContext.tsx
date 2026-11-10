import { useAuth } from '@/contexts/AuthContext'
import { createContext, useContext, useMemo, useState } from 'react'
import type { IconType } from 'react-icons'
import { useTranslation } from 'react-i18next'
import { hasFlag, UserFlags } from '@todo/shared'
import { LuCheck, LuShieldCheck, LuSlidersHorizontal, LuUser } from 'react-icons/lu'

export interface MiniApp {
    name: string;
    path: string;
    Icon: IconType;
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
    const { t } = useTranslation();
    const [miniAppState, setMiniAppState] = useState<MiniAppState | null>(null);
    const { user } = useAuth();

    const apps = useMemo<MiniApp[]>(() => {
        const apps = [{
            name: t('apps.todos'),
            path: '/todos',
            Icon: LuCheck
        },
        {
            name: user?.username ?? t('apps.account'),
            path: '/account',
            Icon: LuUser
        },
        {
            name: t('apps.settings'),
            path: '/settings',
            Icon: LuSlidersHorizontal
        }]

        if (user && hasFlag(user.flags, UserFlags.ADMIN)) {
            apps.unshift({
                name: t('apps.admin'),
                path: '/admin',
                Icon: LuShieldCheck
            });
        }

        return apps;
    }, [user?.username, user?.flags, t]);

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
