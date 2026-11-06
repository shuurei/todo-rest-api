import { create } from 'zustand'
import type { Todo } from '@/types/todo'

interface TodoState {
    todos: Todo[];
    toggleTodo: (todoId: string) => void;
    setTodos: (todos: Todo[]) => void;
    addTodo: (todo: any) => void;
    updateTodo: (todoId: string, data: any) => void;
    removeTodo: (todoId: string) => void;
}

export const useTodoStore = create<TodoState>((set) => ({
    todos: [],
    toggleTodo: (todoId) => set((state) => ({
        todos: state.todos.map((todo) => todo.id === todoId ? { ...todo, isCompleted: !todo.isCompleted } : todo)
    })),
    setTodos: (todos) => set({ todos }),
    addTodo: (todo) => set((state) => ({
        todos: [...state.todos, todo],
    })),
    updateTodo: (todoId, data) => set((state) => ({
        todos: state.todos.map((todo) => todo.id === todoId ? { ...todo, ...data } : todo)
    })),
    removeTodo: (todoId) => set((state) => ({
        todos: state.todos.filter((todo) => todo.id !== todoId),
    }))
}));