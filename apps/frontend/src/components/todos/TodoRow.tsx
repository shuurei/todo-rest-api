import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCheck, LuLoaderCircle, LuPencil, LuTrash2, LuX } from 'react-icons/lu';
import type { Todo } from '@/types/todo';
import { cn } from '@/utils/cn';
import dayjs from '@/utils/date';

type Props = {
    todo: Todo;
    pending: boolean;
    editing: boolean;
    onEdit: () => void;
    onCancelEdit: () => void;
    onSave: (title: string, createdAt: string) => Promise<void>;
    onToggle: () => void;
    onDelete: () => void;
};

const actionClass = 'flex size-11 shrink-0 cursor-pointer items-center justify-center text-theme-muted transition-colors hover:bg-theme-border/10 hover:text-theme-highlight focus-visible:outline-2 focus-visible:outline-theme-accent disabled:cursor-wait disabled:opacity-40';

function TodoEditor({ title, createdAt, pending, onSave, onCancel }: {
    title: string;
    createdAt: string;
    pending: boolean;
    onSave: (title: string, createdAt: string) => Promise<void>;
    onCancel: () => void;
}) {
    const { t } = useTranslation();
    const [draft, setDraft] = useState(title);
    const [invalid, setInvalid] = useState(false);
    const [draftDate, setDraftDate] = useState(() => dayjs(createdAt).format('YYYY-MM-DD'));
    const [invalidDate, setInvalidDate] = useState(false);
    const input = useRef<HTMLInputElement>(null);
    useEffect(() => { input.current?.focus(); input.current?.select(); }, []);

    async function submit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (pending) return;
        const value = draft.trim();
        if (value.length < 3 || value.length > 200) {
            setInvalid(true);
            input.current?.focus();
            return;
        }
        const date = dayjs(draftDate, 'YYYY-MM-DD', true);
        if (!date.isValid()) {
            setInvalidDate(true);
            return;
        }
        await onSave(value, draftDate === dayjs(createdAt).format('YYYY-MM-DD') ? createdAt : date.startOf('day').toISOString());
    }

    return <form onSubmit={submit} className='min-w-0 flex-1' onKeyDown={(event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            if (!pending) onCancel();
        }
    }}>
        <div className='flex items-center gap-1'>
            <input
                ref={input}
                aria-label={t('todo.titleLabel')}
                aria-invalid={invalid}
                value={draft}
                onChange={(event) => { setDraft(event.target.value); setInvalid(false); }}
                disabled={pending}
                maxLength={200}
                autoComplete='off'
                className='min-h-11 min-w-0 flex-1 border-b border-theme-accent bg-transparent px-1 text-sm text-theme-text outline-none disabled:opacity-60'
            />
            <button type='submit' disabled={pending} aria-label={t('common.saveChanges')} title={t('common.saveChanges')} className={actionClass}>
                {pending ? <LuLoaderCircle aria-hidden size={17} className='animate-spin' /> : <LuCheck aria-hidden size={18} />}
            </button>
            <button type='button' disabled={pending} onClick={onCancel} aria-label={t('common.cancel')} title={t('common.cancel')} className={actionClass}>
                <LuX aria-hidden size={17} />
            </button>
        </div>
        <label className='mt-2 flex flex-wrap items-center gap-3 text-[10px] text-theme-muted'>
            {t('todo.date')}
            <input type='date' value={draftDate} disabled={pending} required aria-invalid={invalidDate}
                onChange={(event) => { setDraftDate(event.target.value); setInvalidDate(false); }}
                className='min-h-11 min-w-0 border border-theme-border/30 bg-theme-surface px-2 text-xs text-theme-text focus-visible:outline-2 focus-visible:outline-theme-accent disabled:opacity-50' />
        </label>
        {invalid && <p role='alert' className='mt-2 text-xs text-red-400'>{t('todo.titleHint')}</p>}
        {invalidDate && <p role='alert' className='mt-2 text-xs text-red-400'>{t('todo.invalidDate')}</p>}
    </form>;
}

export default function TodoRow({ todo, pending, editing, onEdit, onCancelEdit, onSave, onToggle, onDelete }: Props) {
    const { t } = useTranslation();
    return <li className={cn(
        'group flex min-w-0 items-start gap-2 py-3 transition-colors sm:gap-3',
        editing ? 'bg-theme-panel/40' : 'hover:bg-theme-panel/30'
    )} aria-busy={pending}>
        <label className={cn('relative flex size-11 shrink-0 items-center justify-center', pending || editing ? 'cursor-default' : 'cursor-pointer')}>
            <input
                type='checkbox'
                checked={todo.isCompleted}
                disabled={pending || editing}
                onChange={onToggle}
                aria-label={t(todo.isCompleted ? 'todo.reopenTask' : 'todo.completeTask', { title: todo.title })}
                className='peer sr-only'
            />
            <span className={cn(
                'flex size-4 items-center justify-center border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-theme-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-theme-page peer-disabled:opacity-50',
                todo.isCompleted ? 'border-theme-accent/60 bg-theme-accent/15 text-theme-highlight' : 'border-theme-border/50 text-theme-muted group-hover:border-theme-accent'
            )}>
                <span aria-hidden className={cn('size-2 bg-theme-accent transition-opacity', todo.isCompleted ? 'opacity-100' : 'opacity-0', pending && !editing && 'animate-pulse')} />
            </span>
        </label>
        {editing ? <TodoEditor title={todo.title} createdAt={todo.createdAt} pending={pending} onSave={onSave} onCancel={onCancelEdit} /> : <>
            <button type='button' onClick={onEdit} disabled={pending} aria-label={t('todo.editTask', { title: todo.title })}
                title={t('common.edit')}
                className={cn('min-h-11 min-w-0 flex-1 cursor-text whitespace-pre-wrap py-2.5 text-left text-sm leading-6 [overflow-wrap:anywhere] hover:text-theme-highlight focus-visible:outline-2 focus-visible:outline-theme-accent disabled:cursor-wait disabled:opacity-50', todo.isCompleted && 'text-theme-dim line-through decoration-theme-border/60')}>
                {todo.title}
            </button>
            <div className='ml-auto flex shrink-0 items-center sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100 [@media(hover:none)]:opacity-100'>
                <button type='button' onClick={onEdit} disabled={pending} aria-label={t('todo.editTask', { title: todo.title })} title={t('common.edit')} className={actionClass}>
                    <LuPencil aria-hidden size={15} />
                </button>
                <button type='button' onClick={onDelete} disabled={pending} aria-label={t('todo.deleteTask', { title: todo.title })} title={t('common.delete')} className={cn(actionClass, 'hover:bg-red-500/10 hover:text-red-400')}>
                    <LuTrash2 aria-hidden size={15} />
                </button>
            </div>
        </>}
    </li>;
}
