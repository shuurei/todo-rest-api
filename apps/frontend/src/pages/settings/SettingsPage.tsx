import { useRef, useState, type RefObject } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { LuHouse, LuLanguages, LuLogOut, LuMenu, LuMonitor, LuPalette, LuUser, LuX } from 'react-icons/lu'
import { AuthAPI } from '@/api/AuthAPI'
import Button from '@/components/common/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useMiniApp } from '@/contexts/MiniAppContext'
import { cn } from '@/utils/cn'

interface SettingsHeaderSectionProps {
    isMenuOpen: boolean;
    menuButtonRef: RefObject<HTMLButtonElement | null>;
    onToggleMenu: () => void;
}

const SettingsHeaderSection = ({ isMenuOpen, menuButtonRef, onToggleMenu }: SettingsHeaderSectionProps) => {
    const { t } = useTranslation();

    return (
        <header className='border-b border-theme-border/20 pb-5'>
            <div className='flex items-center justify-between gap-4'>
                <h1 className='text-2xl font-bold tracking-tight'>{t('settings.title')}</h1>
                <button ref={menuButtonRef} type='button' aria-label={t('settings.categories')} aria-expanded={isMenuOpen}
                    aria-controls='settings-category-menu' onClick={onToggleMenu}
                    className='flex size-11 shrink-0 cursor-pointer items-center justify-center border border-theme-border/30 text-theme-muted hover:border-theme-accent hover:text-theme-highlight focus-visible:outline-2 focus-visible:outline-theme-accent md:hidden'>
                    {isMenuOpen ? <LuX aria-hidden size={22} /> : <LuMenu aria-hidden size={22} />}
                </button>
            </div>
        </header>
    );
};

const CategoriesSection = ({ onNavigate }: { onNavigate: () => void }) => {
    const { t } = useTranslation();

    const categories = [
        { path: 'account', label: t('settings.accountCategory'), Icon: LuUser },
        { path: 'home', label: t('homeSettings.title'), Icon: LuHouse },
        { path: 'appearance', label: t('settings.appearance'), Icon: LuPalette },
        { path: 'language', label: t('common.language'), Icon: LuLanguages },
        { path: 'devices', label: t('devices.title'), Icon: LuMonitor }
    ] as const;

    return (
        <nav aria-label={t('settings.categories')} className='grid gap-2 sm:grid-cols-2 md:grid-cols-1'>
            {categories.map(({ path, label, Icon }) => (
                <NavLink
                    key={path}
                    to={`/settings/${path}`}
                    onClick={onNavigate}
                    className={({ isActive }) => cn(
                        'flex items-center gap-3 border p-4 focus-visible:outline-2 focus-visible:outline-theme-accent',
                        isActive ? 'border-theme-accent bg-theme-border/10 text-theme-highlight'
                            : 'border-theme-border/20 bg-theme-surface/40 text-theme-muted hover:border-theme-border/60'
                    )}>

                    <Icon aria-hidden size={19} className='mt-0.5' />
                    <span className='text-xs font-bold uppercase tracking-wider'>{label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

interface LogoutSectionProps {
    isPending: boolean;
    isConfirming: boolean;
    onAsk: (isConfirming: boolean) => void;
    onConfirm: () => void;
}

const LogoutSection = ({ isPending, isConfirming, onAsk, onConfirm }: LogoutSectionProps) => {
    const { t } = useTranslation();

    return (
        <section className='flex flex-col gap-4 border-t border-theme-border/20 pt-5'>
            {isConfirming ? (
                <div role='alert' className='flex flex-col gap-4 border border-red-500/30 bg-red-950/10 p-4'>
                    <p className='text-xs leading-relaxed text-red-300'>
                        {t('account.confirmLogoutQuestion')}
                    </p>
                    <Button
                        type='button'
                        disabled={isPending}
                        onClick={onConfirm}
                        className='border border-red-500 bg-red-500 text-white hover:bg-red-600'
                    >
                        {t('account.confirmLogout')}
                    </Button>
                    <Button
                        type='button'
                        disabled={isPending}
                        onClick={() => onAsk(false)}
                        className='border border-theme-border/30 text-theme-muted'
                    >
                        {t('common.cancel')}
                    </Button>
                </div>
            ) : (
                <div className='flex flex-col gap-2'>
                    <button
                        type='button'
                        disabled={isPending}
                        onClick={() => onAsk(true)}
                        className='flex cursor-pointer items-center gap-3 p-3 text-left text-xs text-theme-muted hover:bg-theme-border/10 disabled:opacity-50'
                    >
                        <LuLogOut aria-hidden size={17} />{t('account.logout')}
                    </button>
                </div>
            )}
        </section>
    );
};

export default function SettingsPage() {
    const { logout } = useAuth();
    const { clearMiniApp } = useMiniApp();
    const navigate = useNavigate();

    const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handleConfirm = async () => {
        if (!isConfirmingLogout || isPending) return;

        setIsPending(true);

        try {
            await AuthAPI.logout();
            logout();
            clearMiniApp();
            navigate('/auth/login', { replace: true });
        } catch (failure) {
            console.error('Failed to log out', failure);
        } finally {
            setIsPending(false);
        }
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
    };

    const handleNavigate = () => {
        setIsConfirmingLogout(false);
        if (isMenuOpen) {
            closeMenu();
        }
    };

    return (
        <section className='h-full overflow-y-auto p-4 font-mono text-theme-text sm:p-6'>
            <div className='mx-auto flex w-full max-w-6xl flex-col gap-8'>
                <SettingsHeaderSection
                    isMenuOpen={isMenuOpen}
                    menuButtonRef={menuButtonRef}
                    onToggleMenu={() => setIsMenuOpen((current) => !current)}
                />

                <div className='grid items-start gap-8 md:grid-cols-[250px_minmax(0,1fr)]'>
                    <aside id='settings-category-menu' className={cn(isMenuOpen ? 'flex' : 'hidden', 'flex-col gap-5 md:sticky md:top-0 md:flex')}>
                        <CategoriesSection onNavigate={handleNavigate} />
                        <LogoutSection
                            isPending={isPending}
                            isConfirming={isConfirmingLogout}
                            onAsk={setIsConfirmingLogout}
                            onConfirm={handleConfirm}
                        />
                    </aside>

                    <div className='min-w-0 border border-theme-border/20 bg-theme-surface/40 p-4 sm:p-6'>
                        <Outlet />
                    </div>
                </div>
            </div>
        </section>
    );
}
