import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { hasFlag, UserFlags } from '@todo/shared';
import { LuPencil, LuShieldCheck, LuTrash2, LuUser } from 'react-icons/lu';
import { AdminAPI, type UserSearchResponse, type UserStatus } from '@/api/AdminAPI';
import UserEditor from '@/components/admin/UserEditor';
import Dialog from '@/components/Dialog';
import Button from '@/components/common/Button';
import TextInput from '@/components/common/TextInput';
import ScrambleText from '@/components/ScrambleText';
import { useMiniApp } from '@/contexts/MiniAppContext';
import { translateError } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types/user';
import { getApiErrorCode } from '@/utils/api-error';
import { cn } from '@/utils/cn';

function AdminUsers() {
    const { t } = useTranslation();
    const { getUser, logout } = useAuth();
    const navigate = useNavigate();
    const { clearMiniApp } = useMiniApp();
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<UserStatus>('all');
    const [page, setPage] = useState(1);
    const [revision, setRevision] = useState(0);
    const [result, setResult] = useState<UserSearchResponse>({
        data: [],
        meta: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 1
        }
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<'updated' | 'deleted' | null>(null);
    const [editing, setEditing] = useState<User | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        setIsLoading(true);

        setError(null);

        void (async () => {
            try {
                const response = await AdminAPI.searchUsers(query, page, status, controller.signal);

                if (controller.signal.aborted) {
                    return;
                }

                if (page > response.meta.totalPages) {
                    setPage(response.meta.totalPages);

                    return;
                }

                setResult(response);
            } catch (failure) {
                if (!controller.signal.aborted) {
                    setError(getApiErrorCode(failure));
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        })();

        return () => controller.abort();
    }, [query, page, status, revision]);

    function handleSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isPending) {
            return;
        }

        setQuery(search.trim());

        setPage(1);

        setRevision((current) => current + 1);

        setEditing(null);

        setDeleteTarget(null);

        setFeedback(null);
    }

    function handleSaved(updated: User) {
        const currentUser = getUser();

        if (String(currentUser?.id) === String(updated.id)) {
            if (updated.isDisabled || !hasFlag(updated.flags, UserFlags.ADMIN)) {
                clearMiniApp();

                navigate('/', {
                    replace: true
                });

                return;
            }
        }

        setEditing(null);

        setFeedback('updated');

        setRevision((current) => current + 1);
    }

    async function handleDelete() {
        if (!deleteTarget || isPending) {
            return;
        }

        setIsPending(true);

        setError(null);

        setFeedback(null);

        try {
            await AdminAPI.deleteUser(deleteTarget.id);

            const currentUser = getUser();

            if (String(currentUser?.id) === String(deleteTarget.id)) {
                logout();

                clearMiniApp();

                navigate('/auth/login', {
                    replace: true
                });

                return;
            }

            setDeleteTarget(null);

            setFeedback('deleted');

            setRevision((current) => current + 1);
        } catch (failure) {
            setError(getApiErrorCode(failure));
        } finally {
            setIsPending(false);
        }
    }

    return (
        <section className="h-full overflow-y-auto p-3 font-mono text-theme-text sm:p-6">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <ScrambleText
                        as="h1"
                        text={t('admin.title')}
                        className="mt-2 text-xl font-bold tracking-tight sm:text-2xl"
                    />
                    <span className="text-[10px] uppercase tracking-widest text-theme-dim">{t('admin.adminOnly')}</span>
                </header>

                <form
                    onSubmit={handleSearch}
                    className="flex flex-col gap-4 border border-theme-border/20 bg-theme-surface/50 p-4"
                >
                    <TextInput
                        id="admin-search"
                        className="min-h-12 text-base"
                        label={t('admin.searchLabel')}
                        placeholder={t('admin.searchPlaceholder')}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        maxLength={100}
                        disabled={isPending}
                        autoComplete="off"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <label htmlFor="admin-status" className="text-xs uppercase tracking-widest text-theme-muted">
                            {t('admin.statusLabel')}
                        </label>
                        <select
                            id="admin-status"
                            value={status}
                            disabled={isPending}
                            onChange={(event) => {
                                setStatus(event.target.value as UserStatus);

                                setPage(1);

                                setQuery(search.trim());

                                setEditing(null);

                                setDeleteTarget(null);

                                setFeedback(null);
                            }}
                            className="min-h-12 w-full border border-theme-border/30 bg-theme-surface px-3 py-2 text-base text-theme-text outline-none focus:border-theme-accent sm:w-auto sm:min-w-48"
                        >
                            {(['all', 'active', 'disabled'] as const).map((value) => (
                                <option key={value} value={value}>
                                    {t(`admin.status.${value}`)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            type="submit"
                            disabled={isPending || isLoading}
                            className="min-h-12 border border-theme-accent bg-theme-accent text-theme-surface hover:bg-transparent hover:text-theme-highlight focus-visible:ring-theme-accent"
                        >
                            <ScrambleText text={t('admin.search')} />
                        </Button>
                        <Button
                            type="button"
                            disabled={isPending || isLoading}
                            onClick={() => setRevision((current) => current + 1)}
                            className="min-h-12 border border-theme-border/30 bg-transparent text-theme-muted hover:border-theme-accent focus-visible:ring-theme-accent"
                        >
                            {t('admin.refresh')}
                        </Button>
                    </div>
                </form>

                {error && !deleteTarget && (
                    <p role="alert" className="border border-red-400/30 p-4 text-sm text-red-400">
                        {translateError(error)}
                    </p>
                )}
                {feedback && (
                    <p role="status" className="border border-theme-border/30 p-4 text-xs text-theme-highlight">
                        {t(`admin.${feedback}`)}
                    </p>
                )}

                {editing && (
                    <Dialog
                        title={t('admin.editUser', {
                            username: editing.username
                        })}
                        isPending={isPending}
                        onClose={() => setEditing(null)}
                    >
                        <UserEditor
                            key={editing.id}
                            user={editing}
                            onSaved={handleSaved}
                            onCancel={() => setEditing(null)}
                            onPendingChange={setIsPending}
                        />
                    </Dialog>
                )}

                {deleteTarget && (
                    <Dialog
                        title={t('admin.confirmDelete', {
                            username: deleteTarget.username
                        })}
                        isPending={isPending}
                        onClose={() => {
                            setDeleteTarget(null);

                            setError(null);
                        }}
                    >
                        <div className="flex flex-1 flex-col gap-5 p-5">
                            <p className="break-words border border-red-400/30 bg-red-950/10 p-4 text-sm font-bold text-red-400">
                                {deleteTarget.username} · ID: {deleteTarget.id}
                            </p>
                            <p className="text-sm leading-relaxed text-theme-muted">{t('admin.deleteWarning')}</p>
                            {error && (
                                <p role="alert" className="text-sm text-red-400">
                                    {translateError(error)}
                                </p>
                            )}
                        </div>
                        <div className="grid shrink-0 gap-3 border-t border-theme-border/20 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:grid-cols-2">
                            <Button
                                type="button"
                                onClick={() => {
                                    setDeleteTarget(null);

                                    setError(null);
                                }}
                                disabled={isPending}
                                className="min-h-12 border border-theme-border/30 bg-transparent text-theme-muted hover:border-theme-accent focus-visible:ring-theme-accent"
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                type="button"
                                onClick={handleDelete}
                                disabled={isPending}
                                className="min-h-12 border border-red-500 bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-400"
                            >
                                {t('account.confirmDeletion')}
                            </Button>
                        </div>
                    </Dialog>
                )}

                <div className="flex flex-col gap-3" aria-busy={isLoading}>
                    <div className="flex items-center justify-between gap-4 border-b border-theme-border/20 pb-3">
                        <h2 className="text-xs uppercase tracking-[0.2em] text-theme-muted">{t('admin.users')}</h2>
                        <span className="text-[10px] text-theme-dim">
                            {t('admin.results', {
                                count: result.meta.total
                            })}
                        </span>
                    </div>
                    {isLoading ? (
                        <p role="status" className="py-6 text-xs text-theme-muted">
                            {t('common.loading')}
                        </p>
                    ) : error && result.data.length === 0 ? null : result.data.length === 0 ? (
                        <div className="border border-dashed border-theme-border/30 px-6 py-12 text-center">
                            <p className="text-xs text-theme-dim">{t('admin.noUsers')}</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {result.data.map((user) => {
                                const isAdmin = hasFlag(user.flags, UserFlags.ADMIN);
                                const Icon = isAdmin ? LuShieldCheck : LuUser;

                                return (
                                    <article
                                        key={user.id}
                                        className={cn(
                                            'flex min-w-0 flex-col gap-4 border border-theme-border/30 bg-theme-surface/40 p-4 hover:border-theme-border/60',
                                            String(editing?.id) === String(user.id) && 'border-theme-accent'
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="flex size-11 shrink-0 items-center justify-center border border-theme-border/30 bg-theme-border/10">
                                                <Icon aria-hidden size={22} className="text-theme-muted" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="break-words text-base font-bold">{user.username}</h3>
                                                {user.displayName && (
                                                    <p className="mt-1 break-words text-sm text-theme-muted">
                                                        {user.displayName}
                                                    </p>
                                                )}
                                                <p className="mt-2 break-all text-xs text-theme-dim">ID: {user.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="border border-theme-border/30 px-2 py-1 text-xs text-theme-muted">
                                                {t(isAdmin ? 'admin.flags.ADMIN' : 'admin.member')}
                                            </span>
                                            <span
                                                className={cn(
                                                    'border px-2 py-1 text-xs',
                                                    user.isDisabled
                                                        ? 'border-red-400/30 text-red-400'
                                                        : 'border-theme-accent/30 text-theme-highlight'
                                                )}
                                            >
                                                {t(`admin.status.${user.isDisabled ? 'disabled' : 'active'}`)}
                                            </span>
                                        </div>
                                        <div className="mt-auto grid grid-cols-2 gap-3 border-t border-theme-border/20 pt-4">
                                            <button
                                                type="button"
                                                disabled={isPending}
                                                aria-label={t('admin.editUser', {
                                                    username: user.username
                                                })}
                                                onClick={() => {
                                                    setEditing(user);

                                                    setDeleteTarget(null);

                                                    setFeedback(null);

                                                    setError(null);
                                                }}
                                                className="flex min-h-12 cursor-pointer items-center justify-center gap-2 border border-theme-accent/40 px-3 py-3 text-sm text-theme-highlight transition hover:bg-theme-border/10 focus-visible:outline-2 focus-visible:outline-theme-accent disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <LuPencil aria-hidden size={16} />
                                                {t('common.edit')}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isPending}
                                                aria-label={t('admin.confirmDelete', {
                                                    username: user.username
                                                })}
                                                onClick={() => {
                                                    setDeleteTarget(user);

                                                    setEditing(null);

                                                    setFeedback(null);

                                                    setError(null);
                                                }}
                                                className="flex min-h-12 cursor-pointer items-center justify-center gap-2 border border-red-400/30 px-3 py-3 text-sm text-red-400 transition hover:bg-red-950/20 focus-visible:outline-2 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <LuTrash2 aria-hidden size={16} />
                                                {t('common.delete')}
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                    {result.meta.totalPages > 1 && (
                        <nav aria-label={t('admin.pagination')} className="grid grid-cols-2 items-center gap-3 pt-3">
                            <Button
                                type="button"
                                disabled={isPending || isLoading || page <= 1}
                                onClick={() => setPage((current) => current - 1)}
                                className="min-h-12 border border-theme-border/30 bg-transparent text-theme-muted hover:border-theme-accent focus-visible:ring-theme-accent"
                            >
                                {t('admin.previous')}
                            </Button>
                            <span className="col-span-2 row-start-1 text-center text-xs text-theme-muted">
                                {t('admin.page', {
                                    page,
                                    total: result.meta.totalPages
                                })}
                            </span>
                            <Button
                                type="button"
                                disabled={isPending || isLoading || page >= result.meta.totalPages}
                                onClick={() => setPage((current) => current + 1)}
                                className="min-h-12 border border-theme-border/30 bg-transparent text-theme-muted hover:border-theme-accent focus-visible:ring-theme-accent"
                            >
                                {t('admin.next')}
                            </Button>
                        </nav>
                    )}
                </div>
            </div>
        </section>
    );
}

export default function AdminPage() {
    const { user } = useAuth();
    const { clearMiniApp } = useMiniApp();
    const canManageUsers = !!user && !user.isDisabled && hasFlag(user.flags, UserFlags.ADMIN);

    useEffect(() => {
        if (!canManageUsers) {
            clearMiniApp();
        }
    }, [canManageUsers, clearMiniApp]);

    return canManageUsers ? <AdminUsers /> : <Navigate to="/" replace />;
}
