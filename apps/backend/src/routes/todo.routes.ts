import { Router } from 'express'
import { TodoController } from '../controllers/todo.controller'
import { TodoPolicy } from '../policies/todo.policy'
import { authorize } from '../middlewares/authorize.middleware'
import { validateBody } from '../middlewares/validate.middleware'
import { createTodoSchema, updateTodoSchema } from '../validators/todo.schema'

const router = Router({ mergeParams: true });

router.get('/', authorize(TodoPolicy.list, (req) => req.params.userId), TodoController.list);
router.post('/', [
    authorize(TodoPolicy.create, (req) => req.params.userId),
    validateBody(createTodoSchema),
], TodoController.create);

router.patch('/:todoId', [
    authorize(TodoPolicy.update, (req) => req.params.userId),
    validateBody(updateTodoSchema),
], TodoController.update);

router.delete('/:todoId',
    authorize(TodoPolicy.delete, (req) => req.params.userId),
    TodoController.remove,
);

export default router;
