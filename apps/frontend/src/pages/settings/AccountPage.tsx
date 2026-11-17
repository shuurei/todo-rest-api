import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { LuTrash2 } from 'react-icons/lu'
import { UserAPI } from '@/api/UserAPI'
import Button from '@/components/common/Button'
import TextInput from '@/components/common/TextInput'
import SettingsForm from '@/components/settings/SettingsForm'
import FormActionsSection from '@/components/settings/FormActionsSection'
import { useAuth } from '@/contexts/AuthContext'
import { useMiniApp } from '@/contexts/MiniAppContext'
import { Controller, useForm, type Control } from 'react-hook-form'
import type { User } from '@/types/user'

interface AccountValues {
    username: string;
    displayName: string;
}

const getAccountValues = (user: User) => ({
    username: user.username,
    displayName: user.displayName ?? ''
});

const normalizeAccountValues = (values: AccountValues) => ({
    username: values.username.trim(),
    displayName: values.displayName.trim() || null
});

interface AccountIdentitySectionProps {
    control: Control<AccountValues>;
}

const AccountIdentitySection = ({ control }: AccountIdentitySectionProps) => {
    const { t } = useTranslation();

    return (
        <section className='flex flex-col gap-6'>
            <Controller
                control={control}
                name='username'
                render={({ field }) => (
                    <TextInput
                        {...field}
                        id='account-username'
                        label={t('common.username')}
                        autoComplete='username'
                        minLength={2}
                        maxLength={22}
                        required
                    />
                )}
            />

            <Controller
                control={control}
                name='displayName'
                render={({ field }) => (
                    <TextInput
                        {...field}
                        id='account-display-name'
                        label={t('account.displayName')}
                        autoComplete='nickname'
                        minLength={2}
                        maxLength={22}
                    />
                )}
            />
        </section>
    );
};

const AccountForm = () => {
    const { user, getUser } = useAuth();
    const { control, handleSubmit, reset, formState: { isDirty, isSubmitting } } = useForm<AccountValues>({
        defaultValues: getAccountValues(user!)
    });

    const saveAccount = async (values: AccountValues) => {
        try {
            const { data } = await UserAPI.update('@me', normalizeAccountValues(values));
            if (getUser()?.id === user!.id) reset(getAccountValues(data));
        } catch (failure) {
            console.error('Failed to save account', failure);
        }
    };

    return (
        <SettingsForm onSubmit={handleSubmit(saveAccount)} isPending={isSubmitting}>
            <AccountIdentitySection control={control} />
            <FormActionsSection isPending={isSubmitting} isDirty={isDirty} onCancel={() => reset()} />
        </SettingsForm>
    );
};

const DeleteAccountSection = () => {
    const { t } = useTranslation();
    const { logout } = useAuth();
    const { clearMiniApp } = useMiniApp();
    const navigate = useNavigate();
    
    const [isConfirming, setIsConfirming] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const deleteAccount = async () => {
        if (isPending) return;
        setIsPending(true);

        try {
            await UserAPI.deleteAccount();
            logout();
            clearMiniApp();
            navigate('/auth/login', { replace: true });
        } catch (failure) {
            console.error('Failed to delete account', failure);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <section className='flex flex-col gap-4 border-t border-theme-border/20 pt-6'>
            {isConfirming ? (
                <div role='alert' className='flex flex-col gap-4 border border-red-500/30 bg-red-950/10 p-4'>
                    <p className='text-xs leading-relaxed text-red-300'>{t('account.confirmDeletionQuestion')}</p>
                    <div className='flex flex-wrap gap-3'>
                        <Button
                            type='button'
                            disabled={isPending}
                            onClick={deleteAccount}
                            className='w-auto border border-red-500 bg-red-500 text-white hover:bg-red-600'
                        >
                            {t('account.confirmDeletion')}
                        </Button>
                        <Button
                            type='button'
                            disabled={isPending}
                            onClick={() => setIsConfirming(false)}
                            className='w-auto border border-theme-border/30 text-theme-muted'
                        >
                            {t('common.cancel')}
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    type='button'
                    onClick={() => setIsConfirming(true)}
                    className='w-auto self-start border border-red-400/30 text-red-400 hover:border-red-400'
                >
                    <LuTrash2 aria-hidden size={17} />
                    {t('account.deleteAccount')}
                </Button>
            )}
        </section>
    );
};

const AccountPage = () => {
    const { t } = useTranslation();

    return (
        <div className='flex flex-col gap-6'>
            <h1 className='text-xl font-bold tracking-tight'>{t('account.information')}</h1>
            <AccountForm />
            <DeleteAccountSection />
        </div>
    );
};

export default AccountPage;
