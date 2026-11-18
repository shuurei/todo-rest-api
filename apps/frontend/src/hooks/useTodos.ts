import { useEffect, useRef, useState } from 'react';
import { TodoAPI } from '@/api/TodoAPI';
import { useGateway } from '@/hooks/useGateway';
import { Gateway as gateway } from '@/utils/gateway';
import { getApiErrorCode } from '@/utils/api-error';
import type { Todo } from '@/types/todo';

type Change = { baseline: Todo | undefined; value: Todo | null };
const sameTodo = (a: Todo | undefined, b: Todo | undefined) => a === b || !!a && !!b
    && a.id === b.id && a.title === b.title && a.isCompleted === b.isCompleted
    && a.createdAt === b.createdAt && a.updatedAt === b.updatedAt;

export function useTodos() {
    const { todos: serverTodos } = useGateway();
    const initialSource = useRef(serverTodos);
    const mounted = useRef(true);
    const [hydration, setHydration] = useState<{ source: Todo[]; items: Todo[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [changes, setChanges] = useState<Record<string, Change>>({});
    const [error, setError] = useState<string | null>(null);
    const busy = useRef(new Set<string>());
    const [pendingIds, setPendingIds] = useState(new Set<string>());
    const creating = useRef(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        mounted.current = true;
        const controller = new AbortController();
        const source = gateway.getSnapshot().todos;
        initialSource.current = source;
        setLoading(true);
        void TodoAPI.getList(controller.signal).then(({ data }) => {
            if (!controller.signal.aborted) setHydration({ source, items: data });
        }).catch((failure) => {
            if (!controller.signal.aborted && gateway.getSnapshot().todos === source) setError(getApiErrorCode(failure));
        }).finally(() => {
            if (!controller.signal.aborted) setLoading(false);
        });
        return () => {
            mounted.current = false;
            controller.abort();
        };
    }, [loadAttempt]);

    const baseline = hydration?.source === serverTodos ? hydration.items : serverTodos;
    useEffect(() => {
        const current = new Map(baseline.map((todo) => [todo.id, todo]));
        setChanges((previous) => {
            const next = { ...previous };
            let changed = false;
            for (const [id, change] of Object.entries(previous)) {
                const value = current.get(id);
                if ((!change.value && !value) || sameTodo(value, change.value ?? undefined) || !sameTodo(value, change.baseline)) {
                    delete next[id];
                    changed = true;
                }
            }
            return changed ? next : previous;
        });
    }, [baseline]);

    const byId = new Map(baseline.map((todo) => [todo.id, todo]));
    const todos = baseline.flatMap((todo) => {
        const change = changes[todo.id];
        return change && sameTodo(todo, change.baseline) ? change.value ? [change.value] : [] : [todo];
    });
    for (const [id, change] of Object.entries(changes)) {
        if (!byId.has(id) && !change.baseline && change.value) todos.push(change.value);
    }

    // HTTP results bridge the short gap before the matching WebSocket snapshot.
    // A newer server value always wins over an older local acknowledgement.
    function acknowledge(id: string, value: Todo | null, original?: Todo) {
        if (!mounted.current) return;
        const snapshot = gateway.getSnapshot().todos;
        const current = snapshot === hydration?.source ? hydration.items : snapshot;
        const latest = current.find((todo) => todo.id === id);
        if ((!value && !latest) || (value && sameTodo(latest, value))) {
            setChanges((previous) => {
                if (!previous[id]) return previous;
                const next = { ...previous };
                delete next[id];
                return next;
            });
            return;
        }
        if (!sameTodo(latest, original)) return;
        setChanges((previous) => ({ ...previous, [id]: { baseline: latest, value } }));
    }

    async function mutate(id: string, operation: () => Promise<Todo | null>, preserveError = false) {
        if (busy.current.has(id)) return false;
        busy.current.add(id);
        setPendingIds(new Set(busy.current));
        if (!preserveError) setError(null);
        const snapshot = gateway.getSnapshot().todos;
        const current = snapshot === hydration?.source ? hydration.items : snapshot;
        const original = current.find((todo) => todo.id === id);
        try {
            acknowledge(id, await operation(), original);
            return true;
        } catch (failure) {
            if (mounted.current) setError(getApiErrorCode(failure));
            return false;
        } finally {
            busy.current.delete(id);
            if (mounted.current) setPendingIds(new Set(busy.current));
        }
    }

    return {
        todos,
        loading: loading && serverTodos === initialSource.current,
        error,
        pendingIds,
        isCreating,
        dismissError: () => setError(null),
        retry: () => { setError(null); setLoadAttempt((attempt) => attempt + 1); },
        create: async (title: string) => {
            if (creating.current) return false;
            creating.current = true;
            setIsCreating(true);
            setError(null);
            try {
                const { data } = await TodoAPI.create({ title });
                acknowledge(data.id, data);
                return true;
            } catch (failure) {
                if (mounted.current) setError(getApiErrorCode(failure));
                return false;
            } finally {
                creating.current = false;
                if (mounted.current) setIsCreating(false);
            }
        },
        update: (id: string, payload: Pick<Partial<Todo>, 'title' | 'isCompleted' | 'createdAt'>) => mutate(id, async () => {
            const { data } = await TodoAPI.update(id, payload);
            return data;
        }),
        remove: (id: string, preserveError = false) => mutate(id, async () => { await TodoAPI.delete(id); return null; }, preserveError)
    };
}
