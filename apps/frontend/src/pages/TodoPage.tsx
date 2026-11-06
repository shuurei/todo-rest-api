import { useEffect, useMemo, useState } from 'react'

import Button from '@/components/common/Button'
import TextInput from '@/components/common/TextInput'
import { cn } from '@/utils/cn'
import { useTodoStore } from '@/stores/useTodoStore'
import Checkbox from '@/components/common/Checkbox'
import ScrambleText from '@/components/ScrambleText'
import { TodoAPI } from '@/api/TodoAPI'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Todo } from '@/types/todo'

export default function TodoPage() {
    const [title, setTitle] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true);

    const user = useAuthStore((state) => state.user);

    const addTodo = useTodoStore((state) => state.addTodo);
    const updateTodo = useTodoStore((state) => state.updateTodo);
    const removeTodo = useTodoStore((state) => state.removeTodo);
    const todos = useTodoStore((state) => state.todos);
    
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

            updateTodo(editingId, data);
        } else {
            console.log(value)
            const { data } = await TodoAPI.create({ title: value });
            addTodo(data);
        }

        setTitle('');
        setEditingId(null);
    }

    const handleEdit = (todo: Todo) => {
        setEditingId(todo.id)
        setTitle(todo.title)
    }

    const handleDelete = (id: string) => {
        removeTodo(id);

        if (editingId === id) {
            setEditingId(null)
            setTitle('')
        }
    }

    // const handleToggle = async (todo: Todo) => {
    //     const {  } = await TodoAPI.update(user!.id, todo.id, { isCompleted: !todo.isCompleted  });

    //     toggleTodo(id);
    // }

    const handleCancelEdit = () => {
        setEditingId(null)
        setTitle('')
    }

    useEffect(() => {
        const fetchTodos = async () => {
            try {
                const { data } = await TodoAPI.getList();
                useTodoStore.getState().setTodos(data);
            } catch (err) {
                console.log(err);
            } finally {
                setIsLoading(false)
            }
        }

        fetchTodos();
    }, [])

    return (
        <section className='h-full overflow-y-auto p-6 font-mono text-[#c5e6ad]'>
            <div className='mx-auto flex w-full max-w-3xl flex-col gap-8'>
                <header className='flex flex-wrap items-end justify-between gap-4'>
                    <ScrambleText
                        as='h1'
                        text='Todo List'
                        className='mt-3 text-2xl font-bold tracking-tight'      
                    />
                </header>

                <form
                    onSubmit={handleSubmit}
                    className='flex flex-col gap-4 border border-[#5b9c3b]/20 bg-[#080e08]/50 p-4'
                >
                    <TextInput
                        id='todo-title'
                        label='Title task'
                        placeholder='Enter a task..'
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        maxLength={200}
                        autoComplete='none'
                        required
                    />

                    <div className='flex flex-wrap gap-3'>
                        <Button
                            type='submit'
                            className='w-auto border border-[#8bc66a] bg-[#8bc66a] text-[#080e08] hover:bg-transparent hover:text-[#a8d887]'
                        >
                            <ScrambleText text={editingId ? 'Save changes' : 'Create task'} />
                        </Button>

                        {editingId && (
                            <Button
                                type='button'
                                onClick={handleCancelEdit}
                                className='w-auto border border-[#5b9c3b]/30 bg-transparent text-[#82aa6b] hover:border-[#8bc66a]'
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>

                <div className='flex flex-col gap-3'>
                    <div className='flex items-center justify-between border-b border-[#5b9c3b]/20 pb-3'>
                        <h2 className='text-xs uppercase tracking-[0.2em] text-[#82aa6b]'>
                            Tasks
                        </h2>

                        <span className='text-[10px] text-[#49633e]'>
                            {todos.length} entries
                        </span>
                    </div>

                    {isLoading ? (
                        <div>
                            <p>Loading..</p>
                        </div>
                    ) : todos.length === 0 ? (
                        <div className='border border-dashed border-[#5b9c3b]/30 px-6 py-12 text-center'>
                            <p className='text-xs text-[#49633e]'>
                                No tasks found
                            </p>

                            <p className='mt-2 text-[10px] uppercase tracking-widest text-[#49633e]/60'>
                                Create your first objective
                            </p>
                        </div>
                    ) : (
                        sortedTodos.map((todo) => (
                            <article key={todo.id} className='group flex items-center gap-4 border border-[#5b9c3b]/20 bg-[#080e08]/40 p-4 transition-colors hover:border-[#5b9c3b]/50'>
                                <Checkbox
                                    checked={todo.isCompleted}
                                    onChange={() => handleEdit({ ...todo, isCompleted: todo.isCompleted })}
                                />

                                <ScrambleText
                                    key={`${todo.isCompleted}`}
                                    text={todo.title} 
                                    className={cn(
                                        'min-w-0 flex-1 text-sm',
                                        todo.isCompleted &&
                                        'text-[#49633e] line-through',
                                    )}
                                />

                                <div className='flex shrink-0 gap-3'>
                                    <button
                                        type='button'
                                        onClick={() => handleEdit(todo)}
                                        className='cursor-pointer text-xs uppercase tracking-wider text-[#82aa6b] transition hover:text-[#c5e6ad]'
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type='button'
                                        onClick={() => handleDelete(todo.id)}
                                        className='cursor-pointer text-xs uppercase tracking-wider text-red-400/70 transition hover:text-red-400'
                                    >
                                        Delete
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