import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { hasFlag, UserFlags, userDeletionRetentionDays } from '@todo/shared'
import { LuShieldCheck, LuUser } from 'react-icons/lu'
import { AdminAPI, type UserSearchResponse, type UserStatus } from '@/api/AdminAPI'
import UserEditor from '@/components/admin/UserEditor'
import Button from '@/components/common/Button'
import TextInput from '@/components/common/TextInput'
import ScrambleText from '@/components/ScrambleText'
import { useMiniApp } from '@/contexts/MiniAppContext'
import { translateError } from '@/i18n'
import { useAuth } from '@/contexts/AuthContext'
import type { User } from '@/types/user'
import { getApiErrorCode } from '@/utils/api-error'
import { cn } from '@/utils/cn'

function AdminUsers() {
    const { t, i18n } = useTranslation();
    const { getUser, setUser, logout } = useAuth();
    const navigate = useNavigate();
    const { clearMiniApp } = useMiniApp();
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<UserStatus>('all');
    const [page, setPage] = useState(1);
    const [revision, setRevision] = useState(0);
    const [result, setResult] = useState<UserSearchResponse>({
        data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<'updated' | 'deleted' | 'restored' | null>(null);
    const [editing, setEditing] = useState<User | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setIsLoading(true);
        setError(null);
        void (async () => {
            try {
                const response = await AdminAPI.searchUsers(query, page, status, controller.signal);
                if (controller.signal.aborted) return;
                // Deleting the final item on a page returns to the last available page.
                if (page > response.meta.totalPages) {
                    setPage(response.meta.totalPages);
                    return;
                }
                setResult(response);
            } catch (failure) {
                if (!controller.signal.aborted) setError(getApiErrorCode(failure));
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        })();
        return () => controller.abort();
    }, [query, page, status, revision]);

    function handleSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isPending) return;
        setQuery(search.trim());
        setPage(1);
        setRevision(current => current + 1);
        setEditing(null);
        setDeleteTarget(null);
        setFeedback(null);
    }

    function handleSaved(updated: User) {
        const currentUser = getUser();
        if (String(currentUser?.id) === String(updated.id)) {
            setUser(updated);
            if (updated.isDisabled || !hasFlag(updated.flags, UserFlags.ADMIN)) {
                clearMiniApp();
                navigate('/', { replace: true });
                return;
            }
        }
        setEditing(null);
        setFeedback('updated');
        setRevision(current => current + 1);
    }

    async function handleRestore(user: User) {
        if (isPending) return;
        setIsPending(true);
        setError(null);
        setFeedback(null);
        try {
            await AdminAPI.restoreUser(user.id);
            setFeedback('restored');
            setRevision(current => current + 1);
        } catch (failure) {
            setError(getApiErrorCode(failure));
        } finally {
            setIsPending(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget || isPending) return;
        setIsPending(true);
        setError(null);
        setFeedback(null);
        try {
            await AdminAPI.deleteUser(deleteTarget.id);
            const currentUser = getUser();
            if (String(currentUser?.id) === String(deleteTarget.id)) {
                logout();
                clearMiniApp();
                navigate('/auth/login', { replace: true });
                return;
            }
            setDeleteTarget(null);
            setFeedback('deleted');
            setRevision(current => current + 1);
        } catch (failure) {
            setError(getApiErrorCode(failure));
        } finally {
            setIsPending(false);
        }
    }

    return (
        <section className='h-full overflow-y-auto p-6 font-mono text-theme-text'>
            <div className='mx-auto flex w-full max-w-3xl flex-col gap-8'>
                <header className='flex flex-wrap items-end justify-between gap-4'>
                    <ScrambleText as='h1' text={t('admin.title')} className='mt-3 text-2xl font-bold tracking-tight' />
                    <span className='text-[10px] uppercase tracking-widest text-theme-dim'>{t('admin.adminOnly')}</span>
                </header>

                <form onSubmit={handleSearch} className='flex flex-col gap-4 border border-theme-border/20 bg-theme-surface/50 p-4'>
                    <TextInput
                        id='admin-search'
                        label={t('admin.searchLabel')}
                        placeholder={t('admin.searchPlaceholder')}
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        maxLength={100}
                        disabled={isPending}
                        autoComplete='off'
                    />
                    <div className='flex flex-wrap items-center justify-between gap-3'>
                        <label htmlFor='admin-status' className='text-xs uppercase tracking-widest text-theme-muted'>{t('admin.statusLabel')}</label>
                        <select
                            id='admin-status'
                            value={status}
                            disabled={isPending}
                            onChange={event => {
                                setStatus(event.target.value as UserStatus); setPage(1);
                                setQuery(search.trim()); setEditing(null); setDeleteTarget(null); setFeedback(null);
                            }}
                            className='border border-theme-border/30 bg-theme-surface px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-accent'
                        >
                            {(['all', 'active', 'disabled', 'deleted'] as const).map(value => <option key={value} value={value}>{t(`admin.status.${value}`)}</option>)}
                        </select>
                    </div>
                    <div className='flex flex-wrap gap-3'>
                        <Button type='submit' disabled={isPending || isLoading} className='w-auto border border-theme-accent bg-theme-accent text-theme-surface hover:bg-transparent hover:text-theme-highlight focus-visible:ring-theme-accent'>
                            <ScrambleText text={t('admin.search')} />
                        </Button>
                        <Button type='button' disabled={isPending || isLoading} onClick={() => setRevision(current => current + 1)} className='w-auto border border-theme-border/30 bg-transparent text-theme-muted hover:border-theme-accent focus-visible:ring-theme-accent'>
                            {t('admin.refresh')}
                        </Button>
                    </div>
                </form>

                {error && <p role='alert' className='border border-red-400/30 p-4 text-xs text-red-400'>{translateError(error)}</p>}
                {feedback && <p role='status' className='border border-theme-border/30 p-4 text-xs text-theme-highlight'>{t(`admin.${feedback}`)}</p>}

                {editing && <UserEditor
                    key={editing.id}
                    user={editing}
                    onSaved={handleSaved}
                    onCancel={() => setEditing(null)}
                    onPendingChange={setIsPending}
                />}

                {deleteTarget && <div role='alert' className='flex flex-col gap-4 border border-red-500/30 bg-red-950/10 p-4'>
                    <h2 className='text-xs uppercase tracking-wider text-red-400'>{t('admin.confirmDelete', { username: deleteTarget.username })}</h2>
                    <p className='text-xs text-theme-muted'>{t('admin.deleteWarning', { days: userDeletionRetentionDays })}</p>
                    <div className='flex flex-wrap gap-3'>
                        <Button type='button' onClick={handleDelete} disabled={isPending} className='w-auto border border-red-500 bg-red-500 text-theme-surface hover:bg-transparent hover:text-red-400 focus-visible:ring-red-400'>
                            {t('account.confirmDeletion')}
                        </Button>
                        <Button type='button' onClick={() => setDeleteTarget(null)} disabled={isPending} className='w-auto border border-theme-border/30 bg-transparent text-theme-muted hover:border-theme-accent focus-visible:ring-theme-accent'>
                            {t('common.cancel')}
                        </Button>
                    </div>
                </div>}

                <div className='flex flex-col gap-3' aria-busy={isLoading}>
                    <div className='flex items-center justify-between gap-4 border-b border-theme-border/20 pb-3'>
                        <h2 className='text-xs uppercase tracking-[0.2em] text-theme-muted'>{t('admin.users')}</h2>
                        <span className='text-[10px] text-theme-dim'>{t('admin.results', { count: result.meta.total })}</span>
                    </div>
                    {isLoading ? <p role='status' className='py-6 text-xs text-theme-muted'>{t('common.loading')}</p>
                        : error && result.data.length === 0 ? null
                        : result.data.length === 0 ? <div className='border border-dashed border-theme-border/30 px-6 py-12 text-center'>
                            <p className='text-xs text-theme-dim'>{t('admin.noUsers')}</p>
                        </div>
                        : result.data.map(user => {
                            const isAdmin = hasFlag(user.flags, UserFlags.ADMIN);
                            const Icon = isAdmin ? LuShieldCheck : LuUser;
                            return <article key={user.id} className={cn(
                                'group flex flex-wrap items-center gap-4 border border-theme-border/20 bg-theme-surface/40 p-4 transition-colors hover:border-theme-border/50',
                                String(editing?.id) === String(user.id) && 'border-theme-accent',
                            )}>
                                <Icon aria-hidden size={22} className='shrink-0 text-theme-muted' />
                                <div className='min-w-0 flex-1 basis-40'>
                                    <h3 className='break-words text-sm'>{user.username}</h3>
                                    {user.displayName && <p className='mt-1 break-words text-xs text-theme-muted'>{user.displayName}</p>}
                                    <p className='mt-2 text-[10px] text-theme-dim'>ID: {user.id} · {t('admin.flagValue', { value: user.flags })}</p>
                                </div>
                                <div className='flex flex-col gap-2'>
                                    <span className='border border-theme-border/30 px-2 py-1 text-[10px] uppercase tracking-wider text-theme-muted'>{t(isAdmin ? 'admin.flags.ADMIN' : 'admin.member')}</span>
                                    <span className='text-[10px] uppercase tracking-wider text-theme-dim'>{t(`admin.status.${user.deletedAt ? 'deleted' : user.isDisabled ? 'disabled' : 'active'}`)}</span>
                                    {user.deletedAt && <span className='text-[10px] text-theme-dim'>{t('admin.deletedOn', { date: new Date(user.deletedAt).toLocaleDateString(i18n.resolvedLanguage) })}</span>}
                                </div>
                                <div className='flex shrink-0 gap-3'>
                                    {user.deletedAt ? <button type='button' disabled={isPending} onClick={() => { void handleRestore(user); }} className='cursor-pointer text-xs uppercase tracking-wider text-theme-muted hover:text-theme-text disabled:opacity-50'>
                                        {t('admin.restore')}
                                    </button> : <>
                                    <button type='button' disabled={isPending} aria-label={t('admin.editUser', { username: user.username })} onClick={() => {
                                        setEditing(user); setDeleteTarget(null); setFeedback(null); setError(null);
                                    }} className='cursor-pointer text-xs uppercase tracking-wider text-theme-muted transition hover:text-theme-text disabled:cursor-not-allowed disabled:opacity-50'>
                                        {t('common.edit')}
                                    </button>
                                    <button type='button' disabled={isPending} aria-label={t('admin.confirmDelete', { username: user.username })} onClick={() => {
                                        setDeleteTarget(user); setEditing(null); setFeedback(null); setError(null);
                                    }} className='cursor-pointer text-xs uppercase tracking-wider text-red-400/70 transition hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50'>
                                        {t('common.delete')}
                                    </button>
                                    </>}
                                </div>
                            </article>;
                        })}
                    {result.meta.totalPages > 1 && <nav aria-label={t('admin.pagination')} className='flex flex-wrap items-center justify-between gap-3 pt-3'>
                        <Button type='button' disabled={isPending || isLoading || page <= 1} onClick={() => setPage(current => current - 1)} className='w-auto border border-theme-border/30 bg-transparent text-theme-muted hover:border-theme-accent focus-visible:ring-theme-accent'>
                            {t('admin.previous')}
                        </Button>
                        <span className='text-[10px] text-theme-dim'>{t('admin.page', { page, total: result.meta.totalPages })}</span>
                        <Button type='button' disabled={isPending || isLoading || page >= result.meta.totalPages} onClick={() => setPage(current => current + 1)} className='w-auto border border-theme-border/30 bg-transparent text-theme-muted hover:border-theme-accent focus-visible:ring-theme-accent'>
                            {t('admin.next')}
                        </Button>
                    </nav>}
                </div>
            </div>
        </section>
    );
}

export default function AdminPage() {
    const { user } = useAuth();
    const { clearMiniApp } = useMiniApp();
    const canManageUsers = !!user && !user.isDisabled && !user.deletedAt && hasFlag(user.flags, UserFlags.ADMIN);
    useEffect(() => {
        if (!canManageUsers) clearMiniApp();
    }, [canManageUsers, clearMiniApp]);
    return canManageUsers ? <AdminUsers /> : <Navigate to='/' replace />;
}
