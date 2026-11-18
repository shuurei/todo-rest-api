import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { LuLoaderCircle, LuPlus, LuTrash2, LuX } from 'react-icons/lu';
import { useAuth } from '@/contexts/AuthContext';
import { useTodos } from '@/hooks/useTodos';
import { Gateway as gateway } from '@/utils/gateway';
import { cn } from '@/utils/cn';
import { translateError } from '@/i18n';
import { getTodoDateSections, localDateKey } from '@/utils/todo-dates';
import dayjs from '@/utils/date';
import Dialog from '@/components/Dialog';
import TodoRow from '@/components/todos/TodoRow';
import TodoDateGroup from '@/components/todos/TodoDateGroup';
import type { Todo } from '@/types/todo';

type DeleteRequest = { ids: string[] } & (
    | { kind: 'single'; title: string }
    | { kind: 'date'; key: string; label: string }
    | { kind: 'all' }
);
const focusClass = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent';

function TodoWorkspace() {
    const { t, i18n } = useTranslation();
    const collection = useTodos();
    const { todos, pendingIds, loading, isCreating, error } = collection;
    const [title, setTitle] = useState('');
    const [invalidTitle, setInvalidTitle] = useState(false);
    const [now, setNow] = useState(() => dayjs().toDate());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(null);
    const [deleting, setDeleting] = useState(false);
    const deleteLock = useRef(false);
    const composer = useRef<HTMLInputElement>(null);
    const listHeading = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(dayjs().toDate()), 30_000);
        return () => window.clearInterval(timer);
    }, []);
    const sortedTodos = [...todos].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted)
        || dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf() || a.id.localeCompare(b.id));
    const sections = getTodoDateSections(sortedTodos, now);
    function dateLabel(key: string, date: Date) {
        const value = dayjs(date);
        if (value.isSame(now, 'day')) return t('todo.today');
        if (value.isSame(dayjs(now).subtract(1, 'day'), 'day')) return t('todo.yesterday');
        return key === 'unknown' ? t('todo.unknownDate') : value.locale(i18n.resolvedLanguage?.split('-')[0] ?? 'en').format('L');
    }

    function focusList() {
        requestAnimationFrame(() => listHeading.current?.focus());
    }

    async function createTodo(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isCreating || deleteLock.current) return;
        const value = title.trim();
        if (value.length < 3 || value.length > 200) {
            setInvalidTitle(true);
            composer.current?.focus();
            return;
        }
        if (await collection.create(value)) {
            setTitle('');
            setInvalidTitle(false);
            composer.current?.focus();
        }
    }

    async function saveTodo(todo: Todo, value: string, createdAt: string) {
        if ((value === todo.title && createdAt === todo.createdAt) || await collection.update(todo.id, { title: value, createdAt })) {
            setEditingId(null);
            focusList();
        }
    }

    async function confirmDeletion() {
        if (!deleteRequest || deleteLock.current) return;
        const request = deleteRequest;
        const ids = request.ids.filter((id) => todos.some((todo) => todo.id === id && (
            request.kind !== 'date' || localDateKey(dayjs(todo.createdAt).toDate()) === request.key
        )));
        if (!ids.length) { setDeleteRequest(null); return; }
        deleteLock.current = true;
        setDeleting(true);
        collection.dismissError();
        const failed: string[] = [];
        try {
            for (let index = 0; index < ids.length; index += 4) {
                const batch = ids.slice(index, index + 4);
                const results = await Promise.all(batch.map((id) => collection.remove(id, true)));
                results.forEach((success, position) => { if (!success) failed.push(batch[position]); });
            }
            setEditingId((current) => current && ids.includes(current) && !failed.includes(current) ? null : current);
            setDeleteRequest(failed.length ? { ...request, ids: failed } : null);
            if (!failed.length) focusList();
        } finally {
            deleteLock.current = false;
            setDeleting(false);
        }
    }

    return <section className='h-full overflow-y-auto p-4 font-mono text-theme-text sm:p-6'>
        <div className='mx-auto flex w-full max-w-3xl flex-col gap-6 sm:gap-8'>
            <header className='flex flex-wrap items-center justify-between gap-3 border-b border-theme-border/20 pb-5'>
                <h1 className='text-2xl font-bold tracking-tight'>{t('todo.title')}</h1>
                {todos.length > 0 && <button type='button' disabled={deleting || loading || isCreating || pendingIds.size > 0}
                    onClick={() => { collection.dismissError(); setDeleteRequest({ kind: 'all', ids: todos.map((todo) => todo.id) }); }}
                    className={cn('flex min-h-11 cursor-pointer items-center gap-2 text-[10px] text-theme-muted hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40', focusClass)}>
                    <LuTrash2 aria-hidden size={14} />{t('todo.deleteAll')}
                </button>}
            </header>

            <form onSubmit={createTodo} className='flex flex-col gap-2'>
                <div className='flex items-center gap-3 border border-theme-border/30 bg-theme-surface/40 p-2 transition-colors focus-within:border-theme-accent sm:gap-4 sm:p-3'>
                    <LuPlus aria-hidden size={18} className='ml-2 shrink-0 text-theme-dim' />
                    <label htmlFor='todo-quick-add' className='sr-only'>{t('todo.titleLabel')}</label>
                    <input ref={composer} id='todo-quick-add' value={title}
                        onChange={(event) => { setTitle(event.target.value); setInvalidTitle(false); }}
                        placeholder={t('todo.titlePlaceholder')} maxLength={200} disabled={isCreating || deleting} autoComplete='off'
                        aria-invalid={invalidTitle} aria-describedby={invalidTitle ? 'todo-title-hint' : undefined}
                        className='min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-theme-dim disabled:opacity-50' />
                    {isCreating && <LuLoaderCircle aria-hidden size={17} className='mr-2 shrink-0 animate-spin text-theme-dim' />}
                </div>
                {invalidTitle && <p id='todo-title-hint' role='alert' className='text-xs text-red-400'>{t('todo.titleHint')}</p>}
            </form>

            {error && <div role='alert' className='flex items-center gap-2 border border-red-400/25 p-3 text-xs text-red-400'>
                <p className='flex-1'>{translateError(error)}</p>
                <button type='button' onClick={collection.retry} className={cn('min-h-9 cursor-pointer px-2 underline', focusClass)}>{t('todo.retry')}</button>
                <button type='button' onClick={collection.dismissError} aria-label={t('common.close')} className={cn('flex size-9 shrink-0 cursor-pointer items-center justify-center', focusClass)}><LuX aria-hidden size={16} /></button>
            </div>}

            <div role='region' aria-labelledby='todo-list-heading' className='min-w-0'>
                <h2 id='todo-list-heading' ref={listHeading} tabIndex={-1} className='sr-only'>{t('todo.tasks')}</h2>
                {loading ? <div role='status' className='flex justify-center py-16 text-theme-dim'>
                    <LuLoaderCircle aria-hidden size={20} className='animate-spin' /><span className='sr-only'>{t('common.loading')}</span>
                </div> : !todos.length ? <p role='status' className='py-16 text-center text-xs text-theme-dim'>{t('todo.noTasks')}</p>
                    : <div className='flex flex-col gap-8'>
                        {sections.map((section) => <section key={section.key} aria-labelledby={`todo-section-${section.key}`} className='flex flex-col gap-3'>
                            <h3 id={`todo-section-${section.key}`} className={cn('text-[10px] font-bold uppercase tracking-[0.15em] text-theme-dim', section.key === 'today' && 'sr-only')}>
                                {t(`todo.dateSections.${section.key}`)}
                            </h3>
                            {section.groups.map((group) => <TodoDateGroup key={group.key} group={group} section={section.key}
                                label={dateLabel(group.key, group.date)} disabled={deleting || isCreating || pendingIds.size > 0}
                                onDelete={() => {
                                    collection.dismissError();
                                    setDeleteRequest({ kind: 'date', key: group.key, label: dateLabel(group.key, group.date), ids: group.todos.map((todo) => todo.id) });
                                }}>
                                {group.todos.map((todo) => <TodoRow key={todo.id} todo={todo} pending={deleting || pendingIds.has(todo.id)} editing={editingId === todo.id}
                                    onEdit={() => setEditingId(todo.id)} onCancelEdit={() => { setEditingId(null); focusList(); }}
                                    onSave={(value, createdAt) => saveTodo(todo, value, createdAt)}
                                    onToggle={() => { void collection.update(todo.id, { isCompleted: !todo.isCompleted }); }}
                                    onDelete={() => { collection.dismissError(); setDeleteRequest({ kind: 'single', title: todo.title, ids: [todo.id] }); }} />)}
                            </TodoDateGroup>)}
                        </section>)}
                    </div>}
            </div>
            <span role='status' aria-live='polite' className='sr-only'>{isCreating || pendingIds.size > 0 ? t('common.saving') : ''}</span>
        </div>

        {deleteRequest && <Dialog title={t(deleteRequest.kind === 'single' ? 'todo.deleteTitle' : deleteRequest.kind === 'all' ? 'todo.deleteAllTitle' : 'todo.deleteDateTitle')} isPending={deleting} onClose={() => setDeleteRequest(null)}>
            <div className='flex flex-col gap-5 p-5 sm:p-6'>
                <p className='text-sm leading-7 text-theme-muted [overflow-wrap:anywhere]'>{deleteRequest.kind === 'single'
                    ? t('todo.deleteConfirm', { title: deleteRequest.title })
                    : deleteRequest.kind === 'all'
                        ? t('todo.deleteAllConfirm', { count: deleteRequest.ids.length })
                        : t('todo.deleteDateConfirm', { count: deleteRequest.ids.length, date: deleteRequest.label })}</p>
                {error && <p role='alert' className='text-xs text-red-400'>{translateError(error)}</p>}
                <div className='flex justify-end gap-3'>
                    <button type='button' disabled={deleting} onClick={() => setDeleteRequest(null)} className={cn('min-h-11 cursor-pointer border border-theme-border/30 px-4 text-xs text-theme-muted disabled:opacity-40', focusClass)}>{t('common.cancel')}</button>
                    <button type='button' disabled={deleting} onClick={() => { void confirmDeletion(); }} className={cn('min-h-11 cursor-pointer border border-red-400/50 bg-red-500/10 px-4 text-xs text-red-400 hover:bg-red-500/20 disabled:opacity-40', focusClass)}>{t('common.delete')}</button>
                </div>
            </div>
        </Dialog>}
    </section>;
}

export default function TodoPage() {
    const { user } = useAuth();
    useEffect(() => gateway.subscribeTopic('todos'), []);
    return user ? <TodoWorkspace key={user.id} /> : null;
}
