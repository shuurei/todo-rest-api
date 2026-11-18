import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCheck, LuLoaderCircle, LuPencil, LuTrash2, LuX } from 'react-icons/lu';
import type { Todo } from '@/types/todo';
import { cn } from '@/utils/cn';

type Props = {
    todo: Todo;
    pending: boolean;
    editing: boolean;
    dateLabel: string;
    onEdit: () => void;
    onCancelEdit: () => void;
    onSave: (title: string) => Promise<void>;
    onToggle: () => void;
    onDelete: () => void;
};

const actionClass = 'flex size-11 shrink-0 cursor-pointer items-center justify-center text-theme-muted transition-colors hover:bg-theme-border/10 hover:text-theme-highlight focus-visible:outline-2 focus-visible:outline-theme-accent disabled:cursor-wait disabled:opacity-40';

function TodoEditor({ title, pending, onSave, onCancel }: {
    title: string;
    pending: boolean;
    onSave: (title: string) => Promise<void>;
    onCancel: () => void;
}) {
    const { t } = useTranslation();
    const [draft, setDraft] = useState(title);
    const [invalid, setInvalid] = useState(false);
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
        await onSave(value);
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
        {invalid && <p role='alert' className='mt-2 text-xs text-red-400'>{t('todo.titleHint')}</p>}
    </form>;
}

export default function TodoRow({ todo, pending, editing, dateLabel, onEdit, onCancelEdit, onSave, onToggle, onDelete }: Props) {
    const { t } = useTranslation();
    return <li className={cn(
        'group flex min-w-0 items-start gap-3 border border-theme-border/20 bg-theme-surface/40 p-3 transition-colors sm:gap-4 sm:p-4',
        editing ? 'border-theme-accent/50 bg-theme-panel/40' : 'hover:border-theme-border/50 hover:bg-theme-panel/30'
    )} aria-busy={pending}>
        <label className={cn('relative mt-0.5 flex size-11 shrink-0 items-center justify-center', pending || editing ? 'cursor-default' : 'cursor-pointer')}>
            <input
                type='checkbox'
                checked={todo.isCompleted}
                disabled={pending || editing}
                onChange={onToggle}
                aria-label={t(todo.isCompleted ? 'todo.reopenTask' : 'todo.completeTask', { title: todo.title })}
                className='peer sr-only'
            />
            <span className={cn(
                'flex size-6 items-center justify-center border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-theme-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-theme-page peer-disabled:opacity-50',
                todo.isCompleted ? 'border-theme-accent/60 bg-theme-accent/15 text-theme-highlight' : 'border-theme-border/50 text-theme-muted group-hover:border-theme-accent'
            )}>
                {pending && !editing ? <LuLoaderCircle aria-hidden size={13} className='animate-spin' /> : todo.isCompleted ? <LuCheck aria-hidden size={15} /> : null}
            </span>
        </label>
        {editing ? <TodoEditor title={todo.title} pending={pending} onSave={onSave} onCancel={onCancelEdit} /> : <>
            <div className='min-w-0 flex-1 py-2.5'>
                <p className={cn('whitespace-pre-wrap text-sm leading-6 [overflow-wrap:anywhere]', todo.isCompleted && 'text-theme-dim line-through decoration-theme-border/60')}>{todo.title}</p>
                {dateLabel && <time dateTime={todo.createdAt} className='mt-1 block text-[10px] text-theme-dim'>{dateLabel}</time>}
            </div>
            <div className='flex shrink-0 items-center'>
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
