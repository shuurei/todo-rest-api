import type { Request, Response } from 'express'
import { HttpForbiddenError } from '../utils/http-errors'
import { CreateTodoInput, UpdateTodoInput } from '../validators/todo.schema'
import { TodoService } from '../services/todo.service'

export class TodoController {
    static async list(req: Request, res: Response) {
        if (req.userId != req.params.userId) {
            throw new HttpForbiddenError();
        }

        return res.status(200).json({
            data: await TodoService.repo.findBy({ userId: req.userId })
        });
    }

    static async create(req: Request<{ userId: string; }, {}, CreateTodoInput>, res: Response) {
        if (req.userId != req.params.userId) {
            throw new HttpForbiddenError();
        }

        return res.status(201).json({
            data: await TodoService.create(req.params.userId, req.body)
        });
    }

    static async update(req: Request<{ userId: string; todoId: string; }, {}, UpdateTodoInput>, res: Response) {
        if (req.userId != req.params.userId) {
            throw new HttpForbiddenError();
        }

        return res.status(200).json({
            data: await TodoService.update(req.params.userId, req.body)
        });
    }

    static async remove(req: Request<{ userId: string; todoId: string; }>, res: Response) {
        if (req.userId != req.params.userId) {
            throw new HttpForbiddenError();
        }

        await TodoService.repo.delete({
            id: req.params.todoId,
            userId: req.params.userId
        });

        return res.sendStatus(204);
    }
}