import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { LuMonitor, LuSmartphone } from 'react-icons/lu'
import { AuthAPI, type UserSession } from '@/api/AuthAPI'
import Button from '@/components/common/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useMiniApp } from '@/contexts/MiniAppContext'
import { useGateway } from '@/hooks/useGateway'
import { cn } from '@/utils/cn'

const describeDevice = (userAgent: string | null) => {
    if (!userAgent) return null;

    const browser = /Edg\//.test(userAgent) ? 'Edge'
        : /OPR\//.test(userAgent) ? 'Opera'
            : /Firefox|FxiOS/.test(userAgent) ? 'Firefox'
                : /Chrome|CriOS/.test(userAgent) ? 'Chrome'
                    : /Safari/.test(userAgent) ? 'Safari' : null;
    const system = /Android/.test(userAgent) ? 'Android'
        : /iPhone|iPad|iPod/.test(userAgent) ? 'iOS'
            : /Windows/.test(userAgent) ? 'Windows'
                : /Macintosh|Mac OS/.test(userAgent) ? 'macOS'
                    : /Linux/.test(userAgent) ? 'Linux' : null;

    return [browser, system].filter(Boolean).join(' · ') || null;
};

interface RevokeSectionProps {
    target: UserSession | 'all' | null;
    isPending: boolean;
    hasSessions: boolean;
    onRevokeAll: () => void;
    onConfirm: () => void;
    onCancel: () => void;
}

const RevokeSection = ({ target, isPending, hasSessions, onRevokeAll, onConfirm, onCancel }: RevokeSectionProps) => {
    const { t } = useTranslation();

    return (
        <section className='flex flex-col gap-4'>
            {target === 'all' ? (
                <div role='alert' className='flex flex-col gap-4 border border-red-500/30 bg-red-950/10 p-4'>
                    <p className='text-xs leading-relaxed text-red-300'>
                        {t('devices.confirmAll')}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Button type="button" disabled={isPending} onClick={onConfirm} className="w-auto border border-red-500 bg-red-500 text-white hover:bg-red-600">
                            {t('devices.confirmRevoke')}
                        </Button>
                        <Button type="button" disabled={isPending} onClick={onCancel} className="w-auto border border-theme-border/30 text-theme-muted">
                            {t('common.cancel')}
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    type='button'
                    disabled={isPending || !hasSessions}
                    onClick={onRevokeAll}
                    className='w-auto self-start border border-red-400/40 text-red-400 hover:border-red-400'
                >
                    {t('devices.revokeAll')}
                </Button>
            )}
        </section>
    );
};

interface SessionCardProps {
    session: UserSession;
    isPending: boolean;
    isConfirming: boolean;
    onRevoke: (session: UserSession) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

const SessionCard = ({ session, isPending, isConfirming, onRevoke, onConfirm, onCancel }: SessionCardProps) => {
    const { t } = useTranslation();
    const Icon = /Android|iPhone|iPad|iPod|Mobile/i.test(session.userAgent ?? '') ? LuSmartphone : LuMonitor;

    const isLocalhost = session.ipAddress === '::1' || session.ipAddress === '127.0.0.1';
    const ipAddress = session.ipAddress || t('devices.ipUnknown');

    return (
        <article className={cn(
            'flex flex-wrap items-start gap-4 border p-4',
            isConfirming ? 'border-red-500/40' : 'border-theme-border/20',
        )}>
            <Icon aria-hidden size={24} className='shrink-0 text-theme-muted' />

            <div className='flex min-w-0 flex-1 basis-44 flex-col gap-2'>
                <div className='flex items-center justify-between'>
                    <h2 className="text-sm">{describeDevice(session.userAgent) || t('devices.unknown')}</h2>
                    {session.isCurrent && (
                        <span className="self-start border border-theme-accent/40 px-2 py-1 text-[10px] uppercase tracking-wider text-theme-highlight">{t('devices.current')}</span>
                    )}
                </div>

                <span className={cn('text-xs text-theme-muted', session.onlineConnections && 'text-emerald-500')}>{t(session.onlineConnections ? 'devices.online' : 'devices.offline')}</span>

                {!isLocalhost && (
                    <p className='text-xs text-theme-muted'>IP: {ipAddress}</p>
                )}

                {session.userAgent && (
                    <details className='text-xs text-theme-dim'>
                        <summary className='cursor-pointer'>{t('devices.details')}</summary>
                        <p className='mt-2 break-all leading-relaxed'>{session.userAgent}</p>
                    </details>
                )}
            </div>

            {!session.isCurrent && (isConfirming ? (
                <div role='alert' className='flex w-full flex-col gap-3 border-t border-red-500/30 pt-4'>
                    <p className='text-xs leading-relaxed text-red-300'>
                        {t('devices.confirmOne', { device: describeDevice(session.userAgent) || t('devices.unknown') })}
                    </p>
                    <div className='flex flex-wrap gap-3'>
                        <Button
                            type='button'
                            className='w-auto border border-red-500 bg-red-500 text-white hover:bg-red-600'
                            disabled={isPending}
                            onClick={onConfirm}
                        >
                            {t('devices.confirmRevoke')}
                        </Button>

                        <Button
                            type='button'
                            className='w-auto border border-theme-border/30 text-theme-muted'
                            disabled={isPending}
                            onClick={onCancel}
                        >
                            {t('common.cancel')}
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    type='button'
                    className='w-auto border border-red-400/30 text-xs text-red-400 hover:border-red-400'
                    disabled={isPending}
                    onClick={() => onRevoke(session)}
                >
                    {t('devices.revoke')}
                </Button>
            ))}
        </article>
    );
};

interface SessionsSectionProps {
    sessions: UserSession[];
    target: UserSession | 'all' | null;
    isPending: boolean;
    onRevoke: (session: UserSession) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

const SessionsSection = ({ sessions, target, isPending, onRevoke, onConfirm, onCancel }: SessionsSectionProps) => {
    const { t } = useTranslation();
    const sortedSessions = [...sessions].sort((left, right) => Number(right.isCurrent) - Number(left.isCurrent));

    return (
        <section aria-busy={isPending} className='flex flex-col gap-3'>
            {sessions.length === 0 ? (
                <p className='text-xs text-theme-dim'>{t('devices.empty')}</p>
            ) : sortedSessions.map((session) => (
                <SessionCard
                    key={session.id}
                    session={session}
                    isPending={isPending}
                    isConfirming={target !== null && target !== 'all' && target.id === session.id}
                    onRevoke={onRevoke}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                />
            ))}
        </section>
    );
};

export default function DevicesPage() {
    const { t } = useTranslation();
    const { logout } = useAuth();
    const { clearMiniApp } = useMiniApp();
    const { sessions } = useGateway();
    const navigate = useNavigate();

    const [isPending, setIsPending] = useState(false);
    const [target, setTarget] = useState<UserSession | 'all' | null>(null);

    const handleRevoke = async () => {
        if (!target || isPending || (target !== 'all' && target.isCurrent)) return;
        setIsPending(true);

        try {
            if (target === 'all') {
                await AuthAPI.revokeAllSessions();
            } else {
                await AuthAPI.revokeSession(target.id);
            }

            if (target === 'all') {
                logout();
                clearMiniApp();
                navigate('/auth/login', { replace: true });
                return;
            }

            setTarget(null);
        } catch (failure) {
            // 
        } finally {
            setIsPending(false);
        }
    };

    const askToRevoke = (value: UserSession | 'all') => {
        if (value !== 'all' && value.isCurrent) return;
        setTarget(value);
    };

    return (
        <div className='flex flex-col gap-6'>
            <header className='flex flex-col gap-3'>
                <h1 className='text-xl font-bold tracking-tight'>{t('devices.title')}</h1>
                <p className='text-xs leading-relaxed text-theme-muted'>{t('devices.description')}</p>
            </header>

            <RevokeSection
                target={target}
                isPending={isPending}
                hasSessions={sessions.length > 0}
                onRevokeAll={() => askToRevoke('all')}
                onConfirm={handleRevoke}
                onCancel={() => setTarget(null)}
            />

            <SessionsSection
                sessions={sessions}
                target={target}
                isPending={isPending}
                onRevoke={askToRevoke}
                onConfirm={handleRevoke}
                onCancel={() => setTarget(null)}
            />
        </div>
    );
}
