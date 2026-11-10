import { useState } from 'react'
import { userDeletionRetentionDays } from '@todo/shared'
import { useTranslation } from 'react-i18next'
import { translateError } from '@/i18n'

import Button from '@/components/common/Button'
import TextInput from '@/components/common/TextInput'
import { useAuth } from '@/contexts/AuthContext'
import { useMiniApp } from '@/contexts/MiniAppContext'
import { AuthAPI } from '@/api/AuthAPI'
import { UserAPI } from '@/api/UserAPI'

export default function SettingsPage() {
    const { t } = useTranslation();
    const { user, logout } = useAuth();

    const [username, setUsername] = useState(user?.username ?? '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

    const { clearMiniApp } = useMiniApp();
    const [actionError, setActionError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    const handleDeleteAccount = async () => {
        if (isPending) return;
        setIsPending(true);
        setActionError(null);
        try {
            await UserAPI.deleteAccount();
            clearMiniApp();
            logout();
        } catch (error) {
            setActionError((error as { code?: string }).code ?? 'SERVER_ERROR');
        } finally {
            setIsPending(false);
        }
    }

    const handleLogout = async () => {
        if (isPending) return;
        setIsPending(true);
        setActionError(null);
        try {
            await AuthAPI.logout();
            clearMiniApp();
            logout();
        } catch (error) {
            setActionError((error as { code?: string }).code ?? 'SERVER_ERROR');
        } finally {
            setIsPending(false);
        }
    }

    return (
        <section className='h-full overflow-y-auto p-6 font-mono text-theme-text'>
            <div className='mx-auto flex w-full max-w-3xl flex-col gap-8'>
                {actionError && <p role='alert' className='text-xs text-red-400'>{translateError(actionError)}</p>}
                <form className='flex max-w-2xl flex-col gap-6'>
                    <div className='flex items-center justify-between border-b border-theme-border/20 pb-3'>
                        <h2 className='text-xs uppercase tracking-[0.2em] text-theme-muted'>
                            {t('account.information')}
                        </h2>
                    </div>

                    <TextInput
                        id='settings-username'
                        label={t('common.username')}
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        autoComplete='username'
                        required
                    />

                    <div className='border-t border-theme-border/20 pt-6'>
                        <h2 className='mb-5 text-xs uppercase tracking-[0.2em] text-theme-muted'>
                            {t('account.changePassword')}
                        </h2>

                        <div className='flex flex-col gap-6'>
                            <TextInput
                                id='settings-password'
                                label={t('account.newPassword')}
                                type='password'
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete='new-password'
                                placeholder={t('account.keepPassword')}
                            />

                            {password && (
                                <TextInput
                                    id='settings-confirm-password'
                                    label={t('account.confirmPassword')}
                                    type='password'
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    autoComplete='new-password'
                                    required
                                />
                            )}
                        </div>
                    </div>

                    <Button
                        type='submit'
                        className='w-auto self-start border border-theme-accent bg-theme-accent text-theme-surface hover:bg-transparent hover:text-theme-highlight'
                    >
                        {t('common.saveChanges')}
                    </Button>
                </form>

                <div className='max-w-2xl border-t border-red-500/20 pt-6'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-xs uppercase tracking-[0.2em] text-red-400'>
                            {t('account.dangerZone')}
                        </h2>
                    </div>

                    <div className='flex flex-col gap-2'>
                        {!showLogoutConfirmation ? (
                            <Button
                                type='button'
                                onClick={() => setShowLogoutConfirmation(true)}
                                className='mt-5 w-auto border border-red-500/40 bg-transparent text-red-400 hover:border-red-400 hover:bg-red-950/30'
                            >
                                {t('account.logout')}
                            </Button>
                        ) : (
                            <div className='mt-5 flex flex-col gap-4 border border-red-500/30 bg-red-950/10 p-4'>
                                <p className='text-xs text-red-300'>
                                    {t('account.confirmLogoutQuestion')}
                                </p>

                                <div className='flex flex-wrap gap-3'>
                                    <Button
                                        type='button'
                                        onClick={handleLogout}
                                        disabled={isPending}
                                        className='w-auto border border-red-500 bg-red-500 text-theme-surface hover:bg-transparent hover:text-red-400'
                                    >
                                        {t('account.confirmLogout')}
                                    </Button>

                                    <Button
                                        type='button'
                                        onClick={() => setShowLogoutConfirmation(false)}
                                        className='w-auto border border-theme-border/30 bg-transparent text-theme-muted hover:border-theme-accent'
                                    >
                                        {t('common.cancel')}
                                    </Button>
                                </div>
                            </div>
                        )}


                        {!showDeleteConfirmation ? (
                            <Button
                                type='button'
                                onClick={() => setShowDeleteConfirmation(true)}
                                className='mt-5 w-auto border border-red-500/40 bg-transparent text-red-400 hover:border-red-400 hover:bg-red-950/30'
                            >
                                {t('account.deleteAccount')}
                            </Button>
                        ) : (
                            <div className='mt-5 flex flex-col gap-4 border border-red-500/30 bg-red-950/10 p-4'>
                                <p className='text-xs text-red-300'>
                                    {t('account.confirmDeletionQuestion', { days: userDeletionRetentionDays })}
                                </p>

                                <div className='flex flex-wrap gap-3'>
                                    <Button
                                        type='button'
                                        onClick={handleDeleteAccount}
                                        disabled={isPending}
                                        className='w-auto border border-red-500 bg-red-500 text-theme-surface hover:bg-transparent hover:text-red-400'
                                    >
                                        {t('account.confirmDeletion')}
                                    </Button>

                                    <Button
                                        type='button'
                                        onClick={() =>
                                            setShowDeleteConfirmation(false)
                                        }
                                        className='w-auto border border-theme-border/30 bg-transparent text-theme-muted hover:border-theme-accent'
                                    >
                                        {t('common.cancel')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}