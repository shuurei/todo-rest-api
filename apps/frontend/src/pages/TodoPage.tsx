import { useState, type FormEvent } from 'react'

import Button from '@/components/common/Button'
import TextInput from '@/components/common/TextInput'
import { cn } from '@/utils/cn'
import { useTodoStore } from '@/stores/useTodoStore'
import Checkbox from '@/components/common/Checkbox'

interface Todo {
    id: string
    title: string
    completed: boolean
}

export default function TodoPage() {
    const [title, setTitle] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)

    const todos = useTodoStore((state) => state.todos);
    const toggleTodo = useTodoStore((state) => state.toggleTodo);
    const addTodo = useTodoStore((state) => state.addTodo);
    const updateTodo = useTodoStore((state) => state.updateTodo);
    const removeTodo = useTodoStore((state) => state.removeTodo);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const value = title.trim();

        if (!value) return

        if (editingId) {
            updateTodo(editingId, { title: value });
        } else {
            addTodo({
                id: crypto.randomUUID(),
                title: value,
                completed: false,
            });
        }

        setTitle('')
        setEditingId(null)
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

    const handleToggle = (id: string) => {
        toggleTodo(id);
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setTitle('')
    }

    return (
        <section className='h-full overflow-y-auto p-6 font-mono text-[#c5e6ad]'>
            <div className='mx-auto flex w-full max-w-3xl flex-col gap-8'>
                <header className='flex flex-wrap items-end justify-between gap-4'>
                    <div>
                        <h1 className='mt-3 text-2xl font-bold tracking-tight'>
                            Todo list
                        </h1>
                    </div>
                </header>

                <form
                    onSubmit={handleSubmit}
                    className='flex flex-col gap-4 border border-[#5b9c3b]/20 bg-[#080e08]/50 p-4'
                >
                    <div className='flex items-center justify-between'>
                        <p className='text-[10px] uppercase tracking-[0.2em] text-[#82aa6b]'>
                            {editingId ? 'Edit task' : 'New task'}
                        </p>

                        <span className='text-[10px] text-[#49633e]'>
                            {editingId ? 'EDIT_MODE' : 'CREATE_MODE'}
                        </span>
                    </div>

                    <TextInput
                        id='todo-title'
                        label='Task description'
                        placeholder='Enter a task..'
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        maxLength={200}
                        required
                    />

                    <div className='flex flex-wrap gap-3'>
                        <Button
                            type='submit'
                            className='w-auto border border-[#8bc66a] bg-[#8bc66a] text-[#080e08] hover:bg-transparent hover:text-[#a8d887]'
                        >
                            {editingId ? 'Save changes' : 'Create task'}
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

                    {todos.length === 0 ? (
                        <div className='border border-dashed border-[#5b9c3b]/30 px-6 py-12 text-center'>
                            <p className='text-xs text-[#49633e]'>
                                No tasks found
                            </p>

                            <p className='mt-2 text-[10px] uppercase tracking-widest text-[#49633e]/60'>
                                Create your first objective
                            </p>
                        </div>
                    ) : (
                        todos.map((todo, index) => (
                            <article
                                key={todo.id}
                                className='group flex items-center gap-4 border border-[#5b9c3b]/20 bg-[#080e08]/40 p-4 transition-colors hover:border-[#5b9c3b]/50'
                            >
                                <span className='text-[10px] text-[#49633e]'>
                                    {(index + 1).toString().padStart(2, '0')}
                                </span>

                                <Checkbox checked={todo.completed} onChange={() => handleToggle(todo.id)} />

                                <span
                                    className={cn(
                                        'min-w-0 flex-1 text-sm',
                                        todo.completed &&
                                        'text-[#49633e] line-through',
                                    )}
                                >
                                    {todo.title}
                                </span>

                                <div className='flex shrink-0 gap-3'>
                                    <button
                                        type='button'
                                        onClick={() => handleEdit(todo)}
                                        className='cursor-pointer text-[10px] uppercase tracking-wider text-[#82aa6b] transition hover:text-[#c5e6ad]'
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type='button'
                                        onClick={() => handleDelete(todo.id)}
                                        className='cursor-pointer text-[10px] uppercase tracking-wider text-red-400/70 transition hover:text-red-400'
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