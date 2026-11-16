import { useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LuHouse, LuLanguages, LuLogOut, LuMenu, LuMonitor, LuPalette, LuTrash2, LuUser, LuX } from 'react-icons/lu';
import { AuthAPI } from '@/api/AuthAPI';
import { UserAPI } from '@/api/UserAPI';
import Button from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useMiniApp } from '@/contexts/MiniAppContext';
import { translateError } from '@/i18n';
import { getApiErrorCode } from '@/utils/api-error';
import { cn } from '@/utils/cn';

export default function SettingsPage() {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const { clearMiniApp } = useMiniApp();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const [confirmation, setConfirmation] = useState<'delete' | 'logout' | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const categories = [
        {
            path: 'account',
            label: t('settings.accountCategory'),
            description: t('settings.accountDescription'),
            Icon: LuUser
        },
        {
            path: 'home',
            label: t('homeSettings.title'),
            description: t('homeSettings.categoryDescription'),
            Icon: LuHouse
        },
        {
            path: 'appearance',
            label: t('settings.appearance'),
            description: t('settings.appearanceDescription'),
            Icon: LuPalette
        },
        {
            path: 'language',
            label: t('common.language'),
            description: t('settings.languageDescription'),
            Icon: LuLanguages
        },
        {
            path: 'devices',
            label: t('devices.title'),
            description: t('settings.devicesDescription'),
            Icon: LuMonitor
        }
    ];

    async function handleConfirm() {
        if (!confirmation || isPending) {
            return;
        }

        setIsPending(true);

        setError(null);

        try {
            if (confirmation === 'delete') {
                await UserAPI.deleteAccount();
            } else {
                await AuthAPI.logout();
            }

            logout();

            clearMiniApp();

            navigate('/auth/login', {
                replace: true
            });
        } catch (failure) {
            setError(getApiErrorCode(failure));
        } finally {
            setIsPending(false);
        }
    }

    function closeMenu() {
        setIsMenuOpen(false);

        menuButtonRef.current?.focus();
    }

    return (
        <section
            className="h-full overflow-y-auto p-4 font-mono text-theme-text sm:p-6"
            onKeyDown={(event) => {
                if (event.key === 'Escape' && isMenuOpen) {
                    event.stopPropagation();

                    closeMenu();
                }
            }}
        >
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
                <header className="border-b border-theme-border/20 pb-5">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-theme-dim">
                        {user?.displayName || user?.username}
                    </p>
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
                        <button
                            ref={menuButtonRef}
                            type="button"
                            aria-label={t('settings.categories')}
                            aria-expanded={isMenuOpen}
                            aria-controls="settings-category-menu"
                            onClick={() => setIsMenuOpen((current) => !current)}
                            className="flex size-11 shrink-0 cursor-pointer items-center justify-center border border-theme-border/30 text-theme-muted hover:border-theme-accent hover:text-theme-highlight focus-visible:outline-2 focus-visible:outline-theme-accent md:hidden"
                        >
                            {isMenuOpen ? <LuX aria-hidden size={22} /> : <LuMenu aria-hidden size={22} />}
                        </button>
                    </div>
                </header>
                <div className="grid items-start gap-8 md:grid-cols-[250px_minmax(0,1fr)]">
                    <aside
                        id="settings-category-menu"
                        className={cn(isMenuOpen ? 'flex' : 'hidden', 'flex-col gap-5 md:sticky md:top-0 md:flex')}
                    >
                        <nav aria-label={t('settings.categories')} className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
                            {categories.map(({ path, label, description, Icon }) => (
                                <NavLink
                                    key={path}
                                    to={`/settings/${path}`}
                                    onClick={() => {
                                        setConfirmation(null);

                                        setError(null);

                                        if (isMenuOpen) {
                                            closeMenu();
                                        }
                                    }}
                                    className={({ isActive }) =>
                                        cn(
                                            'flex gap-3 border p-4 transition-colors focus-visible:outline-2 focus-visible:outline-theme-accent',
                                            isActive
                                                ? 'border-theme-accent bg-theme-border/10 text-theme-highlight'
                                                : 'border-theme-border/20 bg-theme-surface/40 text-theme-muted hover:border-theme-border/60'
                                        )
                                    }
                                >
                                    <Icon aria-hidden size={19} className="mt-0.5 shrink-0" />
                                    <span className="flex min-w-0 flex-col gap-1">
                                        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                                        <span className="text-[10px] leading-relaxed text-theme-dim">
                                            {description}
                                        </span>
                                    </span>
                                </NavLink>
                            ))}
                        </nav>
                        <div className="flex flex-col gap-2 border-t border-theme-border/20 pt-5">
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                    setConfirmation('delete');

                                    setError(null);
                                }}
                                className="flex cursor-pointer items-center gap-3 p-3 text-left text-xs text-red-400 hover:bg-red-950/20 disabled:opacity-50"
                            >
                                <LuTrash2 aria-hidden size={17} />
                                {t('account.deleteAccount')}
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                    setConfirmation('logout');

                                    setError(null);
                                }}
                                className="flex cursor-pointer items-center gap-3 p-3 text-left text-xs text-theme-muted hover:bg-theme-border/10 disabled:opacity-50"
                            >
                                <LuLogOut aria-hidden size={17} />
                                {t('account.logout')}
                            </button>
                        </div>
                        {confirmation && (
                            <div
                                role="alert"
                                className="flex flex-col gap-4 border border-red-500/30 bg-red-950/10 p-4"
                            >
                                <p className="text-xs leading-relaxed text-red-300">
                                    {t(
                                        confirmation === 'delete'
                                            ? 'account.confirmDeletionQuestion'
                                            : 'account.confirmLogoutQuestion'
                                    )}
                                </p>
                                <Button
                                    type="button"
                                    disabled={isPending}
                                    onClick={handleConfirm}
                                    className="border border-red-500 bg-red-500 text-white hover:bg-red-600"
                                >
                                    {t(confirmation === 'delete' ? 'account.confirmDeletion' : 'account.confirmLogout')}
                                </Button>
                                <Button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => {
                                        setConfirmation(null);

                                        setError(null);
                                    }}
                                    className="border border-theme-border/30 text-theme-muted"
                                >
                                    {t('common.cancel')}
                                </Button>
                            </div>
                        )}
                        {error && (
                            <p role="alert" className="text-xs text-red-400">
                                {translateError(error)}
                            </p>
                        )}
                    </aside>
                    <div className="min-w-0 border border-theme-border/20 bg-theme-surface/40 p-4 sm:p-6">
                        <Outlet />
                    </div>
                </div>
            </div>
        </section>
    );
}
