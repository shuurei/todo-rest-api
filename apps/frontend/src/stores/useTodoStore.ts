import { create } from 'zustand'

interface TodoState {
    todos: any[];
    toggleTodo: (todoId: string) => void;
    addTodo: (todo: any) => void;
    updateTodo: (todoId: string, data: any) => void;
    removeTodo: (todoId: string) => void;
}

export const useTodoStore = create<TodoState>((set) => ({
    todos: [],
    toggleTodo: (todoId) => set((state) => ({
        todos: state.todos.map((todo) => todo.id === todoId ? { ...todo, completed: !todo.completed } : todo)
    })),
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