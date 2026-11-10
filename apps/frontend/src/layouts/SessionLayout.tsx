import { useEffect, useLayoutEffect, useState } from 'react'
import { defaultUserPreferences, userDeletionRetentionDays } from '@todo/shared'
import { useTranslation } from 'react-i18next'
import i18n, { getGuestLanguage } from '@/i18n'
import { Outlet, useLoaderData, useNavigate, type LoaderFunctionArgs } from 'react-router'
import { AuthAPI } from '@/api/AuthAPI'
import { api } from '@/utils/axios'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { MiniAppProvider, useMiniApp } from '@/contexts/MiniAppContext'
import type { User } from '@/types/user'
import MessageDialog from '@/components/MessageDialog'

type SessionIssue = 'expired' | 'disabled' | 'deleted' | null;
interface SessionResult { user: User | null; issue: SessionIssue }

function getSessionIssue(code?: string): SessionIssue {
    if (code === 'USER_DISABLED') return 'disabled';
    if (code === 'USER_DELETED') return 'deleted';
    if (code === 'SESSION_EXPIRED') return 'expired';
    return null;
}

export async function sessionLoader({ request }: LoaderFunctionArgs): Promise<SessionResult> {
    try {
        const { data } = await AuthAPI.check(request.signal);
        request.signal.throwIfAborted();
        return { user: data, issue: null };
    } catch (error) {
        // An obsolete navigation must not replace the current session.
        if (request.signal.aborted) throw error;
        const failure = error as { code?: string };
        return { user: null, issue: getSessionIssue(failure.code) };
    }
}

export default function SessionLayout() {
    const result = useLoaderData() as SessionResult;
    return (
        <AuthProvider session={result}>
            <MiniAppProvider>
                <SessionContent sessionIssue={result.issue} />
            </MiniAppProvider>
        </AuthProvider>
    );
}

function SessionContent({ sessionIssue }: { sessionIssue: SessionIssue }) {
    const { t } = useTranslation();
    const [requestIssue, setRequestIssue] = useState<SessionIssue>(null);
    const issue = requestIssue ?? sessionIssue;
    const { clearMiniApp } = useMiniApp();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const themeColor = user?.preferences.themeColor ?? defaultUserPreferences.themeColor;
    const language = user?.preferences.language ?? getGuestLanguage();

    useLayoutEffect(() => {
        if (i18n.resolvedLanguage !== language) void i18n.changeLanguage(language);
    }, [language]);

    useLayoutEffect(() => {
        document.documentElement.dataset.theme = themeColor;
    }, [themeColor]);

    useEffect(() => {
        if (!user) clearMiniApp();
    }, [user, clearMiniApp]);

    // Handle a session expiring during an API call, not only on navigation.
    // The interceptor belongs to this layout and is removed on unmount.
    useEffect(() => {
        const id = api.interceptors.response.use(undefined, (error) => {
            if (error.code === 'USER_DISABLED' || error.code === 'USER_DELETED') {
                logout();
                setRequestIssue(getSessionIssue(error.code));
            } else if (error.status === 401 && error.requestUrl !== '/users/@me' &&
                !['/auth/login', '/auth/register'].includes(error.requestUrl)) {
                logout();
                if (error.code === 'SESSION_EXPIRED') setRequestIssue('expired');
                else navigate('/auth/login', { replace: true });
            }
            return Promise.reject(error);
        });
        return () => api.interceptors.response.eject(id);
    }, [navigate, logout]);

    return <>
        {!issue && <Outlet />}
        {issue && <MessageDialog
            title={t(issue === 'disabled' ? 'dialogs.disabledTitle' : issue === 'deleted' ? 'dialogs.deletedTitle' : 'dialogs.sessionExpiredTitle')}
            message={t(issue === 'disabled' ? 'dialogs.disabledMessage' : issue === 'deleted' ? 'dialogs.deletedMessage' : 'dialogs.sessionExpiredMessage', { days: userDeletionRetentionDays })}
            action={t(issue === 'expired' ? 'dialogs.reconnect' : 'common.close')}
            onClose={() => {
                setRequestIssue(null);
                clearMiniApp();
                navigate('/auth/login', { replace: true });
            }}
        />}
    </>;
}
