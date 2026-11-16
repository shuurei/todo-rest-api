import { useActionState, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserAPI } from '@/api/UserAPI';
import Button from '@/components/common/Button';
import TextInput from '@/components/common/TextInput';
import { useAuth } from '@/contexts/AuthContext';
import { translateError } from '@/i18n';
import { getApiErrorCode } from '@/utils/api-error';
import type { User } from '@/types/user';

interface AccountFields {
    username: string;
    displayName: string;
}

interface AccountFormState {
    error: string | null;
    savedFields: AccountFields | null;
}

function AccountForm({ user }: { user: User }) {
    const { t } = useTranslation();
    const { getUser } = useAuth();
    const [fields, setFields] = useState<AccountFields>({
        username: user.username,
        displayName: user.displayName ?? ''
    });
    const { username, displayName } = fields;
    const isDirty = username.trim() !== user.username || (displayName.trim() || null) !== user.displayName;
    const [state, submitAction, isPending] = useActionState<AccountFormState, FormData>(
        async (_previousState, formData) => {
            const username = String(formData.get('username') ?? '').trim();
            const displayName = String(formData.get('displayName') ?? '').trim() || null;

            try {
                const payload: Partial<Pick<User, 'username' | 'displayName'>> = {};

                if (username !== user.username) {
                    payload.username = username;
                }

                if (displayName !== user.displayName) {
                    payload.displayName = displayName;
                }

                if (Object.keys(payload).length === 0) {
                    return {
                        error: null,
                        savedFields: null
                    };
                }

                const { data } = await UserAPI.update('@me', payload);
                const currentUser = getUser();

                if (currentUser?.id !== user.id) {
                    return {
                        error: null,
                        savedFields: null
                    };
                }

                const savedFields = {
                    username: data.username,
                    displayName: data.displayName ?? ''
                };

                setFields(savedFields);

                return {
                    error: null,
                    savedFields
                };
            } catch (failure) {
                return {
                    error: getApiErrorCode(failure),
                    savedFields: null
                };
            }
        },
        {
            error: null,
            savedFields: null
        }
    );
    const error = isPending ? null : state.error;
    const saved = !isPending && state.savedFields === fields;

    return (
        <form action={submitAction} aria-busy={isPending} className="flex flex-col gap-6">
            <fieldset disabled={isPending} className="flex min-w-0 flex-col gap-6 disabled:opacity-60">
                <TextInput
                    id="account-username"
                    name="username"
                    label={t('common.username')}
                    value={username}
                    onChange={(event) =>
                        setFields((previous) => ({
                            ...previous,
                            username: event.target.value
                        }))
                    }
                    autoComplete="username"
                    minLength={2}
                    maxLength={22}
                    required
                />
                <TextInput
                    id="account-display-name"
                    name="displayName"
                    label={t('account.displayName')}
                    value={displayName}
                    onChange={(event) =>
                        setFields((previous) => ({
                            ...previous,
                            displayName: event.target.value
                        }))
                    }
                    autoComplete="nickname"
                    minLength={2}
                    maxLength={22}
                />
                <p className="text-xs text-theme-dim">{t('account.displayNameHelp')}</p>
                <Button
                    type="submit"
                    disabled={!isDirty}
                    className="w-auto self-start border border-theme-accent bg-theme-accent text-theme-surface hover:bg-transparent hover:text-theme-highlight"
                >
                    {t(isPending ? 'common.saving' : 'common.saveChanges')}
                </Button>
            </fieldset>
            {error && (
                <p role="alert" className="border border-red-400/30 p-4 text-xs text-red-400">
                    {translateError(error)}
                </p>
            )}
            {saved && (
                <p role="status" className="text-xs text-theme-highlight">
                    {t('account.saved')}
                </p>
            )}
        </form>
    );
}

export default function UserPage() {
    const { t } = useTranslation();
    const { user } = useAuth();

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-xl font-bold tracking-tight">{t('account.information')}</h1>
            {user && <AccountForm key={user.id} user={user} />}
        </div>
    );
}
