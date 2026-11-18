import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { hasFlag, UserFlags } from '@nodus/shared';
import { AdminAPI, type AdminUserUpdate } from '@/api/AdminAPI';
import Button from '@/components/common/Button';
import Checkbox from '@/components/common/Checkbox';
import TextInput from '@/components/common/TextInput';
import ScrambleText from '@/components/ScrambleText';
import { translateError } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types/user';
import { getApiErrorCode } from '@/utils/api-error';

const flagsList = Object.entries(UserFlags) as [keyof typeof UserFlags, number][];

export default function UserEditor({
    user,
    onSaved,
    onCancel,
    onPendingChange
}: {
    user: User;
    onSaved: (user: User) => void;
    onCancel: () => void;
    onPendingChange: (pending: boolean) => void;
}) {
    const { t } = useTranslation();
    const { user: actor } = useAuth();
    const [username, setUsername] = useState(user.username);
    const [displayName, setDisplayName] = useState(user.displayName ?? '');
    const [flags, setFlags] = useState(user.flags);
    const [isDisabled, setIsDisabled] = useState(user.isDisabled);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const normalizedDisplayName = displayName.trim() || null;
    const isDirty =
        username.trim() !== user.username ||
        normalizedDisplayName !== user.displayName ||
        flags !== user.flags ||
        isDisabled !== user.isDisabled;
    const removesOwnAccess = String(actor?.id) === String(user.id) && !hasFlag(flags, UserFlags.ADMIN);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isPending || !isDirty) {
            return;
        }

        const payload: AdminUserUpdate = {};

        if (username.trim() !== user.username) {
            payload.username = username.trim();
        }

        if (normalizedDisplayName !== user.displayName) {
            payload.displayName = normalizedDisplayName;
        }

        if (flags !== user.flags) {
            payload.flags = flags;
        }

        if (isDisabled !== user.isDisabled) {
            payload.isDisabled = isDisabled;
        }

        setIsPending(true);

        onPendingChange(true);

        setError(null);

        try {
            const { data } = await AdminAPI.updateUser(user.id, payload);

            onSaved(data);
        } catch (failure) {
            setError(getApiErrorCode(failure));
        } finally {
            setIsPending(false);

            onPendingChange(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} aria-busy={isPending} className="flex min-h-0 flex-1 flex-col">
            <fieldset
                disabled={isPending}
                className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-5 disabled:opacity-60"
            >
                <p className="text-xs text-theme-muted">ID: {user.id}</p>
                <div className="grid gap-5 sm:grid-cols-2">
                    <TextInput
                        id="admin-username"
                        className="min-h-12 text-base"
                        label={t('common.username')}
                        value={username}
                        onChange={(event) => {
                            setUsername(event.target.value);

                            setError(null);
                        }}
                        minLength={2}
                        maxLength={22}
                        autoComplete="off"
                        required
                    />
                    <TextInput
                        id="admin-display-name"
                        className="min-h-12 text-base"
                        label={t('admin.displayName')}
                        value={displayName}
                        onChange={(event) => {
                            setDisplayName(event.target.value);

                            setError(null);
                        }}
                        minLength={2}
                        autoComplete="off"
                    />
                </div>
                <fieldset className="flex min-w-0 flex-col gap-3 border border-theme-border/20 p-4">
                    <legend className="px-2 text-xs uppercase tracking-[0.2em] text-theme-muted">
                        {t('admin.flagsTitle')}
                    </legend>
                    {flagsList.map(([name, flag]) => (
                        <Checkbox
                            key={name}
                            className="min-h-12 w-full"
                            label={t(`admin.flags.${name}`)}
                            checked={hasFlag(flags, flag)}
                            onChange={(event) => {
                                setFlags((current) => (event.target.checked ? current | flag : current & ~flag));

                                setError(null);
                            }}
                        />
                    ))}
                    <p className="text-2xs text-theme-dim">
                        {t('admin.flagValue', {
                            value: flags
                        })}
                    </p>
                </fieldset>
                <div className="flex flex-col gap-3 border border-theme-border/20 p-4">
                    <Checkbox
                        label={t('admin.disableAccount')}
                        className="min-h-12 w-full"
                        checked={isDisabled}
                        onChange={(event) => {
                            setIsDisabled(event.target.checked);

                            setError(null);
                        }}
                    />
                    <p className="text-xs text-theme-dim">{t('admin.disableHelp')}</p>
                </div>
                {isDisabled && String(actor?.id) === String(user.id) && (
                    <p role="status" className="text-xs text-red-400">
                        {t('admin.selfDisableWarning')}
                    </p>
                )}
                {removesOwnAccess && (
                    <p role="status" className="text-xs text-theme-highlight">
                        {t('admin.selfDemoteWarning')}
                    </p>
                )}
                {error && (
                    <p role="alert" className="border border-red-400/30 p-3 text-sm text-red-400">
                        {translateError(error)}
                    </p>
                )}
            </fieldset>
            <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-theme-border/20 bg-theme-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Button
                    type="submit"
                    disabled={isPending || !isDirty}
                    className="min-h-12 border border-theme-accent bg-theme-accent text-theme-surface hover:bg-transparent hover:text-theme-highlight focus-visible:ring-theme-accent"
                >
                    <ScrambleText text={t(isPending ? 'common.saving' : 'common.saveChanges')} />
                </Button>
                <Button
                    type="button"
                    disabled={isPending}
                    onClick={onCancel}
                    className="min-h-12 border border-theme-border/30 bg-transparent text-theme-muted hover:border-theme-accent focus-visible:ring-theme-accent"
                >
                    {t('common.cancel')}
                </Button>
            </div>
        </form>
    );
}
