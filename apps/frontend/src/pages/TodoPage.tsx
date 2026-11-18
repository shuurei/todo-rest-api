import { useEffect, useMemo, useRef, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
    LuArrowDownUp, LuCheck, LuChevronDown, LuCircleCheck,
    LuListTodo, LuLoaderCircle, LuPlus, LuSearch, LuTrash2, LuX
} from 'react-icons/lu';
import { useAuth } from '@/contexts/AuthContext';
import { useTodos } from '@/hooks/useTodos';
import { Gateway as gateway } from '@/utils/gateway';
import { cn } from '@/utils/cn';
import { translateError } from '@/i18n';
import ScrambleText from '@/components/ScrambleText';
import Dialog from '@/components/Dialog';
import TodoRow from '@/components/todos/TodoRow';
import type { Todo } from '@/types/todo';

type Filter = 'all' | 'active' | 'completed';
type Sort = 'newest' | 'oldest' | 'alphabetical';
type DeleteRequest = { ids: string[]; completedOnly: boolean; title?: string };
type Notice = { kind: 'created' | 'updated' | 'completed' | 'reopened' | 'deleted'; count?: number };

const filters: Filter[] = ['all', 'active', 'completed'];
const sorts: Sort[] = ['newest', 'oldest', 'alphabetical'];
const normalizeSearch = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const focusClass = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent';
const secondaryButton = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-theme-border/30 px-4 text-xs text-theme-muted transition-colors hover:border-theme-accent hover:text-theme-highlight disabled:cursor-not-allowed disabled:opacity-40 ${focusClass}`;

function TodoWorkspace() {
    const { t, i18n } = useTranslation();
    const collection = useTodos();
    const { todos, pendingIds, loading, isCreating, error } = collection;
    const [title, setTitle] = useState('');
    const [invalidTitle, setInvalidTitle] = useState(false);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [sort, setSort] = useState<Sort>('newest');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [completedCollapsed, setCompletedCollapsed] = useState(false);
    const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(null);
    const [deleting, setDeleting] = useState(false);
    const deleteLock = useRef(false);
    const [notice, setNotice] = useState<Notice | null>(null);
    const composer = useRef<HTMLInputElement>(null);
    const search = useRef<HTMLInputElement>(null);
    const listHeading = useRef<HTMLHeadingElement>(null);

    const completed = todos.filter((todo) => todo.isCompleted);
    const remaining = todos.length - completed.length;
    const counts = { all: todos.length, active: remaining, completed: completed.length };
    const percentage = todos.length ? Math.round(completed.length / todos.length * 100) : 0;
    const normalizedQuery = normalizeSearch(query);
    const dateFormatter = useMemo(() => new Intl.DateTimeFormat(i18n.resolvedLanguage, {
        day: 'numeric', month: 'short', year: 'numeric'
    }), [i18n.resolvedLanguage]);
    const visible = [...todos].filter((todo) => (
        (filter === 'all' || (filter === 'completed' ? todo.isCompleted : !todo.isCompleted))
        && normalizeSearch(todo.title).includes(normalizedQuery)
    )).sort((a, b) => {
        if (sort === 'alphabetical') return a.title.localeCompare(b.title, i18n.resolvedLanguage, { sensitivity: 'base' }) || a.id.localeCompare(b.id);
        const difference = (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0);
        return (sort === 'newest' ? -difference : difference) || a.id.localeCompare(b.id);
    });
    const activeVisible = visible.filter((todo) => !todo.isCompleted);
    const completedVisible = visible.filter((todo) => todo.isCompleted);

    function focusList() {
        requestAnimationFrame(() => {
            const active = document.activeElement;
            if (!(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement)) {
                listHeading.current?.focus();
            }
        });
    }

    async function createTodo(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isCreating) return;
        const value = title.trim();
        if (value.length < 3 || value.length > 200) {
            setInvalidTitle(true);
            composer.current?.focus();
            return;
        }
        setNotice(null);
        if (await collection.create(value)) {
            setTitle('');
            setInvalidTitle(false);
            setQuery('');
            if (filter === 'completed') setFilter('active');
            setNotice({ kind: 'created' });
            composer.current?.focus();
        }
    }

    async function toggleTodo(todo: Todo) {
        setNotice(null);
        if (await collection.update(todo.id, { isCompleted: !todo.isCompleted })) {
            setNotice({ kind: todo.isCompleted ? 'reopened' : 'completed' });
            if (filter !== 'all') focusList();
        }
    }

    async function saveTitle(todo: Todo, value: string) {
        if (value === todo.title) { setEditingId((current) => current === todo.id ? null : current); focusList(); return; }
        setNotice(null);
        if (await collection.update(todo.id, { title: value })) {
            setEditingId((current) => current === todo.id ? null : current);
            setNotice({ kind: 'updated' });
            focusList();
        }
    }

    async function confirmDeletion() {
        if (!deleteRequest || deleteLock.current) return;
        const request = deleteRequest;
        const ids = request.ids.filter((id) => todos.some((todo) => todo.id === id && (!request.completedOnly || todo.isCompleted)));
        if (!ids.length) { setDeleteRequest(null); return; }
        deleteLock.current = true;
        setDeleting(true);
        collection.dismissError();
        setNotice(null);
        const failed: string[] = [];
        let removed = 0;
        try {
            // Limit concurrency; each deletion is authorized by the existing API.
            for (let index = 0; index < ids.length; index += 4) {
                const batch = ids.slice(index, index + 4);
                const results = await Promise.all(batch.map((id) => collection.remove(id, true)));
                results.forEach((success, position) => {
                    if (success) removed++;
                    else failed.push(batch[position]);
                });
            }
            if (removed) setNotice({ kind: 'deleted', count: removed });
            setEditingId((current) => current && ids.includes(current) && !failed.includes(current) ? null : current);
            setDeleteRequest(failed.length ? { ...request, ids: failed } : null);
            if (!failed.length) focusList();
        } finally {
            deleteLock.current = false;
            setDeleting(false);
        }
    }

    function renderRow(todo: Todo) {
        const date = new Date(todo.createdAt);
        return <TodoRow
            key={todo.id}
            todo={todo}
            dateLabel={Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date)}
            pending={pendingIds.has(todo.id)}
            editing={editingId === todo.id}
            onEdit={() => { setEditingId(todo.id); setNotice(null); }}
            onCancelEdit={() => { setEditingId(null); focusList(); }}
            onSave={(value) => saveTitle(todo, value)}
            onToggle={() => { void toggleTodo(todo); }}
            onDelete={() => {
                collection.dismissError();
                setDeleteRequest({ ids: [todo.id], completedOnly: false, title: todo.title });
            }}
        />;
    }

    return <section
        className='h-full overflow-y-auto p-4 font-mono text-theme-text sm:p-6 lg:p-8'
        onKeyDownCapture={(event) => {
            if (deleteRequest && event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                if (!deleting) setDeleteRequest(null);
            } else if (event.key === 'Escape' && event.target === search.current && query) {
                event.preventDefault();
                event.stopPropagation();
                setQuery('');
            }
        }}
    >
        <div className='mx-auto flex w-full max-w-5xl flex-col gap-6 sm:gap-8'>
            <header className='flex flex-wrap items-start justify-between gap-5 border-b border-theme-border/20 pb-6'>
                <div className='flex items-start gap-4'>
                    <span aria-hidden className='flex size-12 shrink-0 items-center justify-center border border-theme-accent/30 bg-theme-accent/5 text-theme-highlight'>
                        <LuListTodo size={23} />
                    </span>
                    <div>
                        <p className='mb-2 text-[10px] uppercase tracking-[0.25em] text-theme-dim'>Nodus / {t('todo.workspace')}</p>
                        <ScrambleText as='h1' text={t('todo.title')} duration={450} className='text-2xl font-semibold tracking-tight sm:text-3xl' />
                        <p className='mt-2 text-xs text-theme-muted'>{t('todo.subtitle')}</p>
                    </div>
                </div>
                <div className='min-w-40 flex-1 self-end sm:max-w-56'>
                    <div className='mb-2 flex items-end justify-between gap-4'>
                        <span className='text-[10px] text-theme-muted'>{t('todo.progress')}</span>
                        <span className='text-xl font-light tabular-nums text-theme-highlight'>{percentage}<span className='ml-1 text-xs text-theme-dim'>%</span></span>
                    </div>
                    <div role='progressbar' aria-label={t('todo.progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} className='h-1 overflow-hidden bg-theme-border/15'>
                        <div className='h-full bg-theme-accent transition-[width] duration-300 motion-reduce:transition-none' style={{ width: `${percentage}%` }} />
                    </div>
                </div>
            </header>

            <div className='grid grid-cols-3 gap-2 sm:gap-4' role='group' aria-label={t('todo.filterLabel')}>
                {filters.map((value) => <button
                    key={value}
                    type='button'
                    onClick={() => { setFilter(value); if (value === 'completed') setCompletedCollapsed(false); }}
                    aria-pressed={filter === value}
                    className={cn(
                        'flex min-w-0 cursor-pointer flex-col gap-3 border p-3 text-left transition-colors sm:p-4', focusClass,
                        filter === value ? 'border-theme-accent/50 bg-theme-accent/5' : 'border-theme-border/20 bg-theme-surface/30 hover:border-theme-border/50'
                    )}
                >
                    <span className={cn('text-[9px] uppercase tracking-widest sm:text-[10px]', filter === value ? 'text-theme-highlight' : 'text-theme-muted')}>{t(`todo.filters.${value}`)}</span>
                    <div className='flex items-end justify-between gap-2'>
                        <span className='text-2xl font-light tabular-nums sm:text-3xl'>{counts[value].toLocaleString(i18n.resolvedLanguage)}</span>
                        {value === 'completed' ? <LuCircleCheck aria-hidden size={17} className='mb-1 text-theme-dim' />
                            : value === 'active' ? <span aria-hidden className='mb-2 size-2 bg-theme-accent' />
                                : <LuListTodo aria-hidden size={17} className='mb-1 text-theme-dim' />}
                    </div>
                </button>)}
            </div>

            <div>
                <form onSubmit={createTodo} className='flex items-center gap-2 border border-theme-border/40 bg-theme-surface/60 p-2 transition-colors focus-within:border-theme-accent/70 sm:gap-3 sm:p-3'>
                    <span aria-hidden className='pl-2 text-lg text-theme-accent'>›</span>
                    <label htmlFor='todo-quick-add' className='sr-only'>{t('todo.titleLabel')}</label>
                    <input
                        ref={composer}
                        id='todo-quick-add'
                        name='title'
                        value={title}
                        onChange={(event) => { setTitle(event.target.value); setInvalidTitle(false); }}
                        placeholder={t('todo.titlePlaceholder')}
                        maxLength={200}
                        disabled={isCreating}
                        autoComplete='off'
                        aria-invalid={invalidTitle}
                        aria-describedby={invalidTitle ? 'todo-title-hint' : undefined}
                        className='min-h-11 min-w-0 flex-1 bg-transparent text-sm text-theme-text outline-none placeholder:text-theme-dim disabled:opacity-60'
                    />
                    <button type='submit' disabled={isCreating || !title.trim()} aria-label={t('todo.createTask')}
                        className={cn('flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 border border-theme-accent bg-theme-accent px-3 text-xs font-semibold text-theme-deep transition-colors hover:bg-transparent hover:text-theme-highlight disabled:cursor-not-allowed disabled:opacity-40 sm:px-4', focusClass)}>
                        {isCreating ? <LuLoaderCircle aria-hidden size={17} className='animate-spin' /> : <LuPlus aria-hidden size={17} />}
                        <span className='sr-only sm:not-sr-only'>{t('todo.add')}</span>
                    </button>
                </form>
                {invalidTitle && <p id='todo-title-hint' role='alert' className='mt-2 text-xs text-red-400'>{t('todo.titleHint')}</p>}
                {title.length > 160 && <p className='mt-2 text-right text-[10px] tabular-nums text-theme-dim'>{title.length}/200</p>}
            </div>

            {error && <div role='alert' className='flex items-start gap-3 border border-red-400/25 bg-red-500/5 p-3 text-xs text-red-400'>
                <p className='flex-1 py-2'>{translateError(error)}</p>
                {!todos.length && <button type='button' onClick={collection.retry} className={cn('min-h-9 cursor-pointer px-2 underline', focusClass)}>{t('todo.retry')}</button>}
                <button type='button' onClick={collection.dismissError} aria-label={t('common.close')} className={cn('flex size-9 shrink-0 cursor-pointer items-center justify-center', focusClass)}><LuX aria-hidden size={16} /></button>
            </div>}

            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                <div className='flex min-h-11 flex-1 items-center gap-2 border border-theme-border/25 bg-theme-surface/30 px-3 focus-within:border-theme-accent/60'>
                    <LuSearch aria-hidden size={16} className='shrink-0 text-theme-dim' />
                    <label htmlFor='todo-search' className='sr-only'>{t('todo.search')}</label>
                    <input ref={search} id='todo-search' type='search' value={query} onChange={(event) => setQuery(event.target.value)}
                        placeholder={t('todo.searchPlaceholder')} autoComplete='off'
                        className='min-h-11 min-w-0 flex-1 bg-transparent text-xs text-theme-text outline-none placeholder:text-theme-dim [&::-webkit-search-cancel-button]:appearance-none' />
                    {query && <button type='button' onClick={() => { setQuery(''); search.current?.focus(); }} aria-label={t('todo.clearSearch')} className={cn('flex size-8 cursor-pointer items-center justify-center text-theme-muted', focusClass)}><LuX aria-hidden size={14} /></button>}
                </div>
                <label className='flex min-h-11 items-center gap-2 border border-theme-border/25 bg-theme-surface/30 px-3 text-theme-muted'>
                    <LuArrowDownUp aria-hidden size={15} />
                    <span className='sr-only'>{t('todo.sortLabel')}</span>
                    <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className={cn('min-h-11 w-full cursor-pointer bg-theme-surface text-xs text-theme-muted sm:w-auto', focusClass)}>
                        {sorts.map((value) => <option key={value} value={value}>{t(`todo.sorts.${value}`)}</option>)}
                    </select>
                </label>
            </div>

            <section aria-labelledby='todo-list-heading' className='flex flex-col gap-4'>
                <div className='flex flex-wrap items-center justify-between gap-2 border-b border-theme-border/20 pb-3'>
                    <h2 id='todo-list-heading' ref={listHeading} tabIndex={-1} className='text-[10px] uppercase tracking-[0.2em] text-theme-muted outline-none'>
                        {t(`todo.filters.${filter}`)} <span className='ml-2 tabular-nums text-theme-dim'>/ {visible.length}</span>
                    </h2>
                    {completed.length > 0 && <button type='button' disabled={pendingIds.size > 0 || isCreating}
                        onClick={() => { collection.dismissError(); setDeleteRequest({ ids: completed.map((todo) => todo.id), completedOnly: true }); }}
                        className={cn('inline-flex min-h-9 cursor-pointer items-center gap-2 px-2 text-[10px] text-theme-muted transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40', focusClass)}>
                        <LuTrash2 aria-hidden size={13} />{t('todo.clearCompleted')}
                    </button>}
                </div>
                {loading ? <div role='status' className='space-y-3'>
                    <span className='sr-only'>{t('common.loading')}</span>
                    {[0, 1, 2].map((index) => <div key={index} aria-hidden className='flex items-center gap-4 border border-theme-border/15 p-5 motion-safe:animate-pulse'>
                        <span className='size-6 bg-theme-border/15' /><span className='h-3 w-1/2 bg-theme-border/10' />
                    </div>)}
                </div> : !visible.length ? <div className='flex flex-col items-center border border-dashed border-theme-border/30 px-5 py-14 text-center sm:py-20'>
                    <span aria-hidden className='mb-5 flex size-14 items-center justify-center border border-theme-border/20 text-theme-dim'>
                        {todos.length > 0 && !normalizedQuery && filter === 'active' ? <LuCircleCheck size={25} /> : normalizedQuery ? <LuSearch size={25} /> : <LuListTodo size={25} />}
                    </span>
                    <h3 className='text-sm font-semibold text-theme-text'>{t(!todos.length ? 'todo.noTasks' : normalizedQuery ? 'todo.noResults' : filter === 'active' ? 'todo.allDone' : 'todo.noCompleted')}</h3>
                    <p className='mt-2 max-w-sm text-xs leading-6 text-theme-dim'>{t(!todos.length ? 'todo.firstObjective' : normalizedQuery ? 'todo.searchHelp' : filter === 'active' ? 'todo.allDoneHelp' : 'todo.noCompletedHelp')}</p>
                    {!todos.length ? <button type='button' onClick={() => composer.current?.focus()} className={cn(secondaryButton, 'mt-6')}><LuPlus aria-hidden size={16} />{t('todo.createTask')}</button>
                        : normalizedQuery || filter === 'completed' ? <button type='button' onClick={() => { setQuery(''); setFilter('all'); }} className={cn(secondaryButton, 'mt-6')}>{t('todo.resetFilters')}</button> : null}
                </div> : <div className='flex flex-col gap-6'>
                    {activeVisible.length > 0 && <div>
                        {filter === 'all' && <h3 className='mb-3 text-[10px] uppercase tracking-widest text-theme-dim'>{t('todo.filters.active')} <span className='ml-1 tabular-nums'>({activeVisible.length})</span></h3>}
                        <ul className='flex flex-col gap-2'>{activeVisible.map(renderRow)}</ul>
                    </div>}
                    {completedVisible.length > 0 && <div>
                        <button type='button' aria-expanded={!completedCollapsed} aria-controls='todo-completed-list'
                            onClick={() => setCompletedCollapsed((current) => !current)}
                            className={cn('mb-3 flex min-h-9 cursor-pointer items-center gap-2 text-[10px] uppercase tracking-widest text-theme-dim hover:text-theme-highlight', focusClass)}>
                            <LuChevronDown aria-hidden size={14} className={cn('transition-transform motion-reduce:transition-none', completedCollapsed && '-rotate-90')} />
                            {t('todo.filters.completed')} <span className='tabular-nums'>({completedVisible.length})</span>
                        </button>
                        <ul id='todo-completed-list' hidden={completedCollapsed} className={cn(!completedCollapsed && 'flex flex-col gap-2')}>{completedVisible.map(renderRow)}</ul>
                    </div>}
                </div>}
            </section>
            <p role='status' aria-live='polite' className='flex min-h-5 items-center gap-2 text-[10px] text-theme-muted'>
                {isCreating || pendingIds.size > 0 ? <><LuLoaderCircle aria-hidden size={12} className='animate-spin' />{t('common.saving')}</>
                    : notice && !error ? <><LuCheck aria-hidden size={13} />{t(`todo.feedback.${notice.kind}`, { count: notice.count ?? 1 })}</> : null}
            </p>
        </div>

        {deleteRequest && <Dialog title={t(deleteRequest.completedOnly ? 'todo.deleteCompletedTitle' : 'todo.deleteTitle')} isPending={deleting} onClose={() => setDeleteRequest(null)}>
            <div className='flex flex-col gap-5 p-5 sm:p-6'>
                <p className='text-sm leading-7 text-theme-muted [overflow-wrap:anywhere]'>{deleteRequest.completedOnly
                    ? t('todo.deleteCompletedConfirm', { count: deleteRequest.ids.length })
                    : t('todo.deleteConfirm', { title: deleteRequest.title })}</p>
                <p className='text-xs text-theme-dim'>{t('todo.deleteWarning')}</p>
                {error && <p role='alert' className='text-xs text-red-400'>{translateError(error)}</p>}
                <div className='flex flex-wrap justify-end gap-3'>
                    <button type='button' disabled={deleting} onClick={() => setDeleteRequest(null)} className={secondaryButton}>{t('common.cancel')}</button>
                    <button type='button' disabled={deleting} onClick={() => { void confirmDeletion(); }}
                        className={cn('inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-red-400/50 bg-red-500/10 px-4 text-xs text-red-400 hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-50', focusClass)}>
                        {deleting ? <LuLoaderCircle aria-hidden size={15} className='animate-spin' /> : <LuTrash2 aria-hidden size={15} />}
                        {t('common.delete')}
                    </button>
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
