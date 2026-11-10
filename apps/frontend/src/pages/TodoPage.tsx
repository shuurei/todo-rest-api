import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Button from '@/components/common/Button'
import TextInput from '@/components/common/TextInput'
import { cn } from '@/utils/cn'
import { useAuth } from '@/contexts/AuthContext'
import Checkbox from '@/components/common/Checkbox'
import ScrambleText from '@/components/ScrambleText'
import { TodoAPI } from '@/api/TodoAPI'
import type { Todo } from '@/types/todo'

function TodoList() {
    const { t } = useTranslation();
    const [title, setTitle] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true);

    const [todos, setTodos] = useState<Todo[]>([]);
    
    const sortedTodos = useMemo(() => {
        return [...todos].sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) {
                return  Number(a.isCompleted) - Number(b.isCompleted);
            }

            return a.id.localeCompare(b.id);
        });
    }, [todos]);

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();

        const value = title.trim();
        if (!value) return

        if (editingId) {
            const { data } = await TodoAPI.update(editingId, { title: value });

            setTodos(current => current.map(todo => todo.id === editingId ? { ...todo, ...data } : todo));
        } else {
            const { data } = await TodoAPI.create({ title: value });
            setTodos(current => [...current, data]);
        }

        setTitle('');
        setEditingId(null);
    }

    const handleEdit = (todo: Todo) => {
        setEditingId(todo.id);
        setTitle(todo.title);
    }

    const handleDelete = async (id: string) => {
        await TodoAPI.delete(id);

        setTodos(current => current.filter(todo => todo.id !== id));

        if (editingId === id) {
            setEditingId(null)
            setTitle('')
        }
    }

    const handleToggle = async (todo: Todo) => {
        const { data } = await TodoAPI.update(todo.id, { isCompleted: !todo.isCompleted  });
        setTodos(current => current.map(item => item.id === todo.id ? { ...item, ...data } : item));
    }

    const handleCancelEdit = () => {
        setEditingId(null);
        setTitle('');
    }

    useEffect(() => {
        const controller = new AbortController();
        const fetchTodos = async () => {
            try {
                const { data } = await TodoAPI.getList(controller.signal);
                if (!controller.signal.aborted) setTodos(data);
            } catch (err) {
                if (!controller.signal.aborted) console.error(err);
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        };

        void fetchTodos();
        return () => controller.abort();
    }, []);

    return (
        <section className='h-full overflow-y-auto p-6 font-mono text-theme-text'>
            <div className='mx-auto flex w-full max-w-3xl flex-col gap-8'>
                <header className='flex flex-wrap items-end justify-between gap-4'>
                    <ScrambleText
                        as='h1'
                        text={t('todo.title')}
                        className='mt-3 text-2xl font-bold tracking-tight'      
                    />
                </header>

                <form
                    onSubmit={handleSubmit}
                    className='flex flex-col gap-4 border border-theme-border/20 bg-theme-surface/50 p-4'
                >
                    <TextInput
                        id='todo-title'
                        label={t('todo.titleLabel')}
                        placeholder={t('todo.titlePlaceholder')}
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        maxLength={200}
                        autoComplete='none'
                        required
                    />

                    <div className='flex flex-wrap gap-3'>
                        <Button
                            type='submit'
                            className='w-auto border border-theme-accent bg-theme-accent text-theme-surface hover:bg-transparent hover:text-theme-highlight'
                        >
                            <ScrambleText text={t(editingId ? 'common.saveChanges' : 'todo.createTask')} />
                        </Button>

                        {editingId && (
                            <Button
                                type='button'
                                onClick={handleCancelEdit}
                                className='w-auto border border-theme-border/30 bg-transparent text-theme-muted hover:border-theme-accent'
                            >
                                {t('common.cancel')}
                            </Button>
                        )}
                    </div>
                </form>

                <div className='flex flex-col gap-3'>
                    <div className='flex items-center justify-between border-b border-theme-border/20 pb-3'>
                        <h2 className='text-xs uppercase tracking-[0.2em] text-theme-muted'>
                            {t('todo.tasks')}
                        </h2>

                        <span className='text-[10px] text-theme-dim'>
                            {t('todo.entries', { count: todos.length })}
                        </span>
                    </div>

                    {isLoading ? (
                        <div>
                            <p>{t('common.loading')}</p>
                        </div>
                    ) : todos.length === 0 ? (
                        <div className='border border-dashed border-theme-border/30 px-6 py-12 text-center'>
                            <p className='text-xs text-theme-dim'>
                                {t('todo.noTasks')}
                            </p>

                            <p className='mt-2 text-[10px] uppercase tracking-widest text-theme-dim/60'>
                                {t('todo.firstObjective')}
                            </p>
                        </div>
                    ) : (
                        sortedTodos.map((todo) => (
                            <article key={todo.id} className='group flex items-center gap-4 border border-theme-border/20 bg-theme-surface/40 p-4 transition-colors hover:border-theme-border/50'>
                                <Checkbox
                                    checked={todo.isCompleted}
                                    onChange={() => handleToggle(todo)}
                                />

                                <ScrambleText
                                    key={`${todo.isCompleted}`}
                                    text={todo.title} 
                                    className={cn(
                                        'min-w-0 flex-1 text-sm',
                                        todo.isCompleted &&
                                        'text-theme-dim line-through',
                                    )}
                                />

                                <div className='flex shrink-0 gap-3'>
                                    <button
                                        type='button'
                                        onClick={() => handleEdit(todo)}
                                        className='cursor-pointer text-xs uppercase tracking-wider text-theme-muted transition hover:text-theme-text'
                                    >
                                        {t('common.edit')}
                                    </button>

                                    <button
                                        type='button'
                                        onClick={() => handleDelete(todo.id)}
                                        className='cursor-pointer text-xs uppercase tracking-wider text-red-400/70 transition hover:text-red-400'
                                    >
                                        {t('common.delete')}
                                    </button>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}

export default function TodoPage() {
    const { user } = useAuth();
    // A different account gets fresh local state and its own pending requests.
    return user ? <TodoList key={user.id} /> : null;
}