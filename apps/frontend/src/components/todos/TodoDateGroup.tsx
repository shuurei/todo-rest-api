import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCheck, LuClock, LuTrash2 } from 'react-icons/lu';
import type { TodoDateGroup as DateGroup, TodoDateSection } from '@/utils/todo-dates';
import { cn } from '@/utils/cn';

export default function TodoDateGroup({ group, section, label, disabled, onDelete, children }: {
    group: DateGroup;
    section: TodoDateSection;
    label: string;
    disabled: boolean;
    onDelete: () => void;
    children: ReactNode;
}) {
    const { t } = useTranslation();
    const done = group.todos.filter((todo) => todo.isCompleted).length;
    const complete = done === group.todos.length;
    const partial = done > 0 && !complete;
    const overdue = section === 'past' && !complete;
    const status = complete ? 'complete' : partial ? 'partial' : overdue ? 'overdue' : section === 'upcoming' ? 'scheduled' : 'notStarted';

    return <section aria-labelledby={`todo-date-${group.key}`} className={cn(
        'min-w-0 border transition-colors',
        complete ? 'border-theme-border/20 bg-theme-surface/20'
            : section === 'today' ? 'border-theme-accent/50 border-l-2 bg-theme-accent/5'
                : section === 'upcoming' ? 'border-dashed border-theme-border/30 bg-theme-surface/20'
                    : overdue && !partial ? 'border-red-400/25 border-l-2 bg-red-400/5'
                        : partial ? 'border-theme-accent/25 bg-theme-surface/40' : 'border-theme-border/20 bg-theme-surface/40'
    )}>
        <div className={cn('flex items-center justify-between gap-2 border-b pl-4 pr-2',
            complete ? 'border-theme-border/10' : section === 'today' ? 'border-theme-accent/20' : 'border-theme-border/20')}>
            <div className='flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 py-3'>
                <h4 id={`todo-date-${group.key}`} className={cn('text-[10px] font-bold uppercase tracking-wider',
                    complete ? 'text-theme-dim' : section === 'today' ? 'text-theme-highlight' : 'text-theme-muted')}>
                    {label}
                </h4>
                <span className={cn('inline-flex items-center gap-2 text-[9px]',
                    complete ? 'text-theme-dim' : overdue && !partial ? 'text-red-400' : partial ? 'text-theme-highlight' : 'text-theme-dim')}>
                    {complete ? <LuCheck aria-hidden size={12} /> : section === 'upcoming' && !partial ? <LuClock aria-hidden size={12} /> :
                        <span aria-hidden className='flex size-2.5 border border-current p-px'>
                            <span className='h-full bg-current' style={{ width: partial ? '50%' : '0%' }} />
                        </span>}
                    {t(`todo.groupStatus.${status}`)}
                    <span className='tabular-nums text-theme-dim'>{done}/{group.todos.length}</span>
                </span>
            </div>
            <button type='button' disabled={disabled} onClick={onDelete}
                aria-label={t('todo.deleteDate', { date: label })} title={t('todo.deleteDate', { date: label })}
                className='flex size-11 shrink-0 cursor-pointer items-center justify-center text-theme-dim hover:text-red-400 focus-visible:outline-2 focus-visible:outline-theme-accent disabled:cursor-not-allowed disabled:opacity-40'>
                <LuTrash2 aria-hidden size={14} />
            </button>
        </div>
        <ul className='divide-y divide-theme-border/15 px-2 sm:px-3'>{children}</ul>
    </section>;
}
