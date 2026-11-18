import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { normalizeUserPreferences } from '@nodus/shared'
import type { User } from '@/types/user'
import { useGateway } from '@/hooks/useGateway'

interface AuthContextValue {
    user: User | null;
    logout: () => void;
    getUser: () => User | null;
}

const normalizeUser = (user: User | null) => {
    if (!user) return null

    return {
        ...user,
        preferences: normalizeUserPreferences(user.preferences)
    };
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode; }) {
    const snapshot = useGateway();

    const [session, setSession] = useState(() => ({
        source: snapshot,
        user: normalizeUser(snapshot.user)
    }));

    const userRef = useRef(session.user);

    if (session.source !== snapshot) {
        setSession({
            source: snapshot,
            user: normalizeUser(snapshot.user)
        });
    }

    useLayoutEffect(() => {
        userRef.current = session.user;
    }, [session.user]);

    const setUser = useCallback((user: User | null) => {
        const normalized = normalizeUser(user);

        userRef.current = normalized;

        setSession((current) => ({
            ...current,
            user: normalized
        }));
    }, []);

    const logout = useCallback(() => setUser(null), [setUser]);
    const getUser = useCallback(() => userRef.current, []);

    const value = useMemo(() => ({
        user: session.user,
        logout,
        getUser
    }), [session.user, logout, getUser]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
