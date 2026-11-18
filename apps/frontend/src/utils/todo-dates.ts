import type { Todo } from '../types/todo';
import dayjs from './date.ts';

export function localDateKey(date: Date): string {
    const value = dayjs(date);
    return value.isValid() ? value.format('YYYY-MM-DD') : 'unknown';
}

export type TodoDateGroup = { key: string; date: Date; todos: Todo[] };
export type TodoDateSection = 'today' | 'past' | 'upcoming' | 'undated';

export function groupTodosByDate(todos: Todo[]) {
    const groups = new Map<string, TodoDateGroup>();
    for (const todo of todos) {
        const date = dayjs(todo.createdAt).toDate();
        const key = localDateKey(date);
        const group = groups.get(key);
        if (group) group.todos.push(todo);
        else groups.set(key, { key, date, todos: [todo] });
    }
    return [...groups.values()];
}

export function getTodoDateSections(todos: Todo[], now: Date) {
    const sections: Record<TodoDateSection, TodoDateGroup[]> = { today: [], past: [], upcoming: [], undated: [] };
    for (const group of groupTodosByDate(todos)) {
        const date = dayjs(group.date);
        const section = !date.isValid() ? 'undated' : date.isSame(now, 'day') ? 'today' : date.isAfter(now, 'day') ? 'upcoming' : 'past';
        sections[section].push(group);
    }
    sections.past.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
    sections.upcoming.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
    return (['today', 'past', 'undated', 'upcoming'] as const)
        .filter((key) => sections[key].length > 0)
        .map((key) => ({ key, groups: sections[key] }));
}
