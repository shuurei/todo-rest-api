import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LuMonitor, LuSmartphone } from 'react-icons/lu';
import { AuthAPI, type UserSession } from '@/api/AuthAPI';
import Button from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useMiniApp } from '@/contexts/MiniAppContext';
import { translateError } from '@/i18n';
import { getApiErrorCode } from '@/utils/api-error';
import { useGateway } from '@/hooks/useGateway';

function describeDevice(userAgent: string | null): string | null {
    if (!userAgent) {
        return null;
    }

    const browser = /Edg\//.test(userAgent)
        ? 'Edge'
        : /OPR\//.test(userAgent)
          ? 'Opera'
          : /Firefox|FxiOS/.test(userAgent)
            ? 'Firefox'
            : /Chrome|CriOS/.test(userAgent)
              ? 'Chrome'
              : /Safari/.test(userAgent)
                ? 'Safari'
                : null;
    const system = /Android/.test(userAgent)
        ? 'Android'
        : /iPhone|iPad|iPod/.test(userAgent)
          ? 'iOS'
          : /Windows/.test(userAgent)
            ? 'Windows'
            : /Macintosh|Mac OS/.test(userAgent)
              ? 'macOS'
              : /Linux/.test(userAgent)
                ? 'Linux'
                : null;

    return [browser, system].filter(Boolean).join(' · ') || null;
}

export default function DevicesPage() {
    const { t } = useTranslation();
    const { logout } = useAuth();
    const { clearMiniApp } = useMiniApp();
    const navigate = useNavigate();
    const { sessions } = useGateway();
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState(false);
    const [target, setTarget] = useState<UserSession | 'all' | null>(null);

    async function handleRevoke() {
        if (!target || isPending || (target !== 'all' && target.isCurrent)) {
            return;
        }

        setIsPending(true);

        setError(null);

        setFeedback(false);

        try {
            if (target === 'all') {
                await AuthAPI.revokeAllSessions();
            } else {
                await AuthAPI.revokeSession(target.id);
            }

            if (target === 'all' || target.isCurrent) {
                logout();

                clearMiniApp();

                navigate('/auth/login', {
                    replace: true
                });

                return;
            }

            setTarget(null);

            setFeedback(true);
        } catch (failure) {
            setError(getApiErrorCode(failure));
        } finally {
            setIsPending(false);
        }
    }

    function askToRevoke(value: UserSession | 'all') {
        if (value !== 'all' && value.isCurrent) {
            return;
        }

        setTarget(value);

        setError(null);

        setFeedback(false);
    }

    const busy = isPending;

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-3">
                <h1 className="text-xl font-bold tracking-tight">{t('devices.title')}</h1>
                <p className="text-xs leading-relaxed text-theme-muted">{t('devices.description')}</p>
            </header>
            <div className="flex flex-wrap gap-3">
                <Button
                    type="button"
                    disabled={busy || sessions.length === 0}
                    onClick={() => askToRevoke('all')}
                    className="w-auto border border-red-400/40 text-red-400 hover:border-red-400"
                >
                    {t('devices.revokeAll')}
                </Button>
            </div>
            {target && (
                <div role="alert" className="flex flex-col gap-4 border border-red-500/30 bg-red-950/10 p-4">
                    <p className="text-xs leading-relaxed text-red-300">
                        {target === 'all'
                            ? t('devices.confirmAll')
                            : t('devices.confirmOne', {
                                  device: describeDevice(target.userAgent) || t('devices.unknown')
                              })}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            type="button"
                            disabled={isPending}
                            onClick={handleRevoke}
                            className="w-auto border border-red-500 bg-red-500 text-white hover:bg-red-600"
                        >
                            {t('devices.confirmRevoke')}
                        </Button>
                        <Button
                            type="button"
                            disabled={isPending}
                            onClick={() => setTarget(null)}
                            className="w-auto border border-theme-border/30 text-theme-muted"
                        >
                            {t('common.cancel')}
                        </Button>
                    </div>
                </div>
            )}
            {error && (
                <p role="alert" className="text-xs text-red-400">
                    {translateError(error)}
                </p>
            )}
            {feedback && (
                <p role="status" className="text-xs text-theme-highlight">
                    {t('devices.revoked')}
                </p>
            )}
            <div aria-busy={busy} className="flex flex-col gap-3">
                {sessions.length === 0 ? (
                    <p className="text-xs text-theme-dim">{t('devices.empty')}</p>
                ) : (
                    sessions.map((session) => {
                        const Icon = /Android|iPhone|iPad|iPod/i.test(session.userAgent ?? '')
                            ? LuSmartphone
                            : LuMonitor;

                        return (
                            <article
                                key={session.id}
                                className="flex flex-wrap items-start gap-4 border border-theme-border/20 p-4"
                            >
                                <Icon aria-hidden size={24} className="shrink-0 text-theme-muted" />
                                <div className="flex min-w-0 flex-1 basis-44 flex-col gap-2">
                                    <h2 className="text-sm">
                                        {describeDevice(session.userAgent) || t('devices.unknown')}
                                    </h2>
                                    <span className="text-xs text-theme-muted">
                                        {t(session.onlineConnections ? 'devices.online' : 'devices.offline')}
                                    </span>
                                    {session.isCurrent && (
                                        <span className="self-start border border-theme-accent/40 px-2 py-1 text-[10px] uppercase tracking-wider text-theme-highlight">
                                            {t('devices.current')}
                                        </span>
                                    )}
                                    <p className="text-xs text-theme-muted">
                                        {t('devices.ipAddress', {
                                            ip: session.ipAddress || t('devices.ipUnknown')
                                        })}
                                    </p>
                                    {(session.ipAddress === '127.0.0.1' || session.ipAddress === '::1') && (
                                        <p className="text-[10px] text-theme-dim">{t('devices.localConnection')}</p>
                                    )}
                                    {session.userAgent && (
                                        <details className="text-[10px] text-theme-dim">
                                            <summary className="cursor-pointer">{t('devices.details')}</summary>
                                            <p className="mt-2 break-all leading-relaxed">{session.userAgent}</p>
                                        </details>
                                    )}
                                </div>
                                {!session.isCurrent && (
                                    <Button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => askToRevoke(session)}
                                        className="w-auto border border-red-400/30 text-xs text-red-400 hover:border-red-400"
                                    >
                                        {t('devices.revoke')}
                                    </Button>
                                )}
                            </article>
                        );
                    })
                )}
            </div>
        </div>
    );
}
