import { AppDataSource } from '../db'

import { HttpNotFoundError } from '../utils/http-errors'
import { CreateTodoInput, UpdateTodoInput } from '../validators/todo.schema'
import { Todo } from '../entities/todo.entity'

export class TodoService {
    static get repo() {
        return AppDataSource.getRepository(Todo);
    }

    static async create(userId: string, data: CreateTodoInput) {
        const todo = this.repo.create({ ...data, userId });

        return await this.repo.save(todo);
    }

    static async update(userId: string, id: string, data: UpdateTodoInput) {
        const todo = await this.repo.findOneBy({ userId, id });
        if (!todo) {
            throw new HttpNotFoundError('TODO_NOT_FOUND');
        }

        Object.assign(todo, data);

        return await this.repo.save(todo);
    }
}