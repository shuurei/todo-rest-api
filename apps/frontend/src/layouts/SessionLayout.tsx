import { useEffect, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import i18n, { getGuestLanguage } from '@/i18n'
import { Outlet, useNavigate } from 'react-router'
import { api } from '@/utils/axios'
import { Gateway as gateway } from '@/utils/gateway'
import { useGateway } from '@/hooks/useGateway'
import { useMiniApp } from '@/contexts/MiniAppContext'
import MessageDialog from '@/components/MessageDialog'
import ConnectionDialog from '@/components/ConnectionDialog'

export default function SessionLayout() {
    const { t } = useTranslation();
    const { user } = useGateway();
    const { status, initialized, issue, retryAt, closeCode } = useGateway();
    const { apps, miniAppState, clearMiniApp } = useMiniApp();
    const navigate = useNavigate();

    const language = user?.preferences.language ?? getGuestLanguage();
    const connected = status === 'ready';

    useEffect(() => {
        gateway.start();
        return () => gateway.stop();
    }, []);

    useLayoutEffect(() => {
        if (i18n.resolvedLanguage !== language) {
            i18n.changeLanguage(language);
        }
    }, [language]);

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

    return (
        <>
            <div hidden={!connected} inert={!connected}>
                {initialized && !issue && <Outlet />}
            </div>

            {!connected && (
                <ConnectionDialog
                    retryAt={retryAt}
                    fatalCode={status === 'fatal' ? closeCode : null}
                />
            )}

            {connected && issue && (
                <MessageDialog
                    title={t(issue === 'disabled' ? 'dialogs.disabledTitle' : 'dialogs.sessionExpiredTitle')}
                    message={t(issue === 'disabled' ? 'dialogs.disabledMessage' : 'dialogs.sessionExpiredMessage')}
                    action={t(issue === 'expired' ? 'dialogs.reconnect' : 'common.close')}
                    onClose={() => {
                        gateway.dismissIssue();
                        clearMiniApp();
                        navigate('/auth/login', { replace: true });
                    }}
                />
            )}
        </>
    );
}