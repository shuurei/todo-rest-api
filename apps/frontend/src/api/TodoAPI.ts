import { api } from '@/utils/axios'
import type { ApiResponse } from '@/types/api'
import type { Todo } from '@/types/todo'

export class TodoAPI {
    static get api() {
        return api;
    };

    static async getList(signal?: AbortSignal) {
        return await api.get<ApiResponse<Todo[]>>(`/users/@me/todos`, { signal });
    }

    static async create(payload: Partial<Todo>) {
        return await api.post<ApiResponse<Todo>>(`/users/@me/todos`, payload);
    }

    static async update(todoId: string, payload: Partial<Todo>) {
        return await api.patch<ApiResponse<Todo>>(`/users/@me/todos/${todoId}`, payload);
    }

    static async delete(todoId: string) {
        return await api.delete<ApiResponse<Todo>>(`/users/@me/todos/${todoId}`);
    }
}