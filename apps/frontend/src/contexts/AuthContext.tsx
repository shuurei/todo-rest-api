import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { defaultUserPreferences } from '@todo/shared'
import type { User } from '@/types/user'

interface AuthContextValue {
    user: User | null;
    setUser: (user: User | null) => void;
    logout: () => void;
    // Read the latest session after an async request, not its captured render value.
    getUser: () => User | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeUser(user: User | null): User | null {
    return user ? { ...user, preferences: { ...defaultUserPreferences, ...user.preferences } } : null;
}

export function AuthProvider({ session: snapshot, children }: { session: { user: User | null }; children: ReactNode }) {
    const [session, setSession] = useState(() => ({ source: snapshot, user: normalizeUser(snapshot.user) }));
    const userRef = useRef(session.user);

    // Synchronize a new loader snapshot before rendering children. An effect alone
    // could let route guards redirect using the previous session during revalidation.
    if (session.source !== snapshot) {
        setSession({ source: snapshot, user: normalizeUser(snapshot.user) });
    }

    useLayoutEffect(() => {
        userRef.current = session.user;
    }, [session.user]);

    const setUser = useCallback((user: User | null) => {
        const normalized = normalizeUser(user);
        userRef.current = normalized;
        setSession(current => ({ ...current, user: normalized }));
    }, []);
    const logout = useCallback(() => setUser(null), [setUser]);
    const getUser = useCallback(() => userRef.current, []);
    const value = useMemo(() => ({ user: session.user, setUser, logout, getUser }), [session.user, setUser, logout, getUser]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
