import { AppDataSource } from '../db'

import { HttpNotFoundError } from '../utils/http-errors'
import { CreateTodoInput, UpdateTodoInput } from '../validators/todo.schema'
import { Todo } from '../entities/todo.entity'

export class TodoService {
    static get repo() {
        return AppDataSource.getRepository(Todo);
    }

    static async create(userId: string, data: CreateTodoInput) {
        const count = await this.repo.count({ where: { userId } });

        const todo = this.repo.create({
            ...data,
            userId,
            id: (count + 1).toString()
        });

        return await this.repo.save(todo);
    }

    static async update(userId: string, data: UpdateTodoInput) {
        const todo = await this.repo.findOneBy({ id: userId });
        if (!todo) {
            throw new HttpNotFoundError('TODO_NOT_FOUND');
        }

        Object.assign(todo, data);

        return await this.repo.save(todo);
    }
}