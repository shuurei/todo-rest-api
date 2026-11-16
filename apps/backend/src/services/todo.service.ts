import { AppDataSource } from '../db';
import { HttpNotFoundError } from '../utils/http-errors';
import { CreateTodoInput, UpdateTodoInput } from '../validators/todo.schema';
import { Todo } from '../entities/todo.entity';
import { emitGatewayEvent } from '../wss/events';

export class TodoService {
    static get repo() {
        return AppDataSource.getRepository(Todo);
    }

    static async create(userId: string, data: CreateTodoInput) {
        const todo = this.repo.create({
            ...data,
            userId
        });
        const saved = await this.repo.save(todo);

        emitGatewayEvent({
            type: 'TODOS_CHANGED',
            userId
        });

        return saved;
    }

    static async update(userId: string, id: string, data: UpdateTodoInput) {
        const result = await this.repo
            .createQueryBuilder()
            .update(Todo)
            .set(data)
            .where('id = :id AND "userId" = :userId', {
                id,
                userId
            })
            .returning('*')
            .execute();

        if (!result.raw[0]) {
            throw new HttpNotFoundError('TODO_NOT_FOUND');
        }

        emitGatewayEvent({
            type: 'TODOS_CHANGED',
            userId
        });

        return this.repo.create(result.raw[0] as Todo);
    }

    static async remove(userId: string, id: string) {
        await this.repo.delete({
            userId,
            id
        });

        emitGatewayEvent({
            type: 'TODOS_CHANGED',
            userId
        });
    }
}
