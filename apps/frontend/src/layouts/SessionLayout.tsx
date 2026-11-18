import { useEffect, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import i18n, { getGuestLanguage } from '@/i18n'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { api } from '@/utils/axios'
import { Gateway as gateway } from '@/utils/gateway'
import { useGateway } from '@/hooks/useGateway'
import { useMiniApp } from '@/contexts/MiniAppContext'
import MessageDialog from '@/components/MessageDialog'
import AuthPage from '@/pages/AuthPage'

export default function SessionLayout() {
    const { t } = useTranslation();
    const { user, status, initialized, issue } = useGateway();
    const { apps, miniAppState, clearMiniApp } = useMiniApp();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isAuthRoute = pathname === '/auth' || pathname.startsWith('/auth/');

    const language = user?.preferences.language ?? getGuestLanguage();
    const connected = status === 'ready';

    useEffect(() => {
        gateway.start();
        return () => gateway.stop();
    }, []);

    useLayoutEffect(() => {
        if (!connected) return;

        if (i18n.resolvedLanguage !== language) {
            void i18n.changeLanguage(language);
        }
    }, [language, connected]);

    useEffect(() => {
        if (!user) {
            clearMiniApp();
        } else if (miniAppState && !apps.some((app) => app.path === miniAppState.path)) {
            clearMiniApp();
            navigate('/', { replace: true });
        }
    }, [user, apps, miniAppState, clearMiniApp, navigate]);

    useEffect(() => {
        const id = api.interceptors.response.use(undefined, (error) => {
            if (
                !['/auth/login', '/auth/register', '/users/@me'].includes(error.requestUrl)
                && (error.status === 401 || error.code === 'USER_DISABLED')
            ) gateway.reconnect();

            return Promise.reject(error);
        });

        return () => api.interceptors.response.eject(id);
    }, []);

    if (!connected && !(isAuthRoute && !user)) {
        return <AuthPage />
    }

    if (connected && issue) {
        return <MessageDialog
            title={t(issue === 'disabled' ? 'dialogs.disabledTitle' : 'dialogs.sessionExpiredTitle')}
            message={t(issue === 'disabled' ? 'dialogs.disabledMessage' : 'dialogs.sessionExpiredMessage')}
            action={t(issue === 'expired' ? 'dialogs.reconnect' : 'common.close')}
            onClose={() => {
                gateway.dismissIssue();
                clearMiniApp();
                navigate('/auth/login', { replace: true });
            }}
        />
    }

    if (initialized || (isAuthRoute && !user)) {
        return <Outlet />
    }
}