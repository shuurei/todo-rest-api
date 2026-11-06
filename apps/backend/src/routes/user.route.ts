import { Router } from 'express'
import { UserController } from '../controllers/user.controller'

import { authMiddleware } from '../middlewares/auth.middleware'
import { resolveMe } from '../middlewares/resolve-me.middleware'
import { validateBody } from '../middlewares/validate.middleware'
import { updateUserSchema } from '../validators/user.schema'
import { TodoController } from '../controllers/todo.controller'
import { createTodoSchema, updateTodoSchema } from '../validators/todo.schema'

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Retrieve user
 *     description: Retrieve a user using their ID or @me to retrieve the authenticated user
 *     tags: [Users]
 *     security:
 *       - TOKEN: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: User ID or "@me" to target the authenticated user
 *         schema:
 *           type: string
 *         example: "@me"
 *     responses:
 *       '200':
 *         description: User successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:userId', resolveMe, UserController.show);

/**
 * @swagger
 * /api/users/{userId}:
 *   patch:
 *     summary: Update user
 *     description: Update a user using their ID or @me to target the authenticated user
 *     tags: [Users]
 *     security:
 *       - TOKEN: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: User ID or @me to target the authenticated user
 *         schema:
 *           type: string
 *         example: "@me"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "admin"
 *     responses:
 *       '200':
 *         description: User successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/:userId', [resolveMe, validateBody(updateUserSchema)], UserController.update);

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Delete user
 *     description: Delete a user using their ID or @me to target the authenticated user
 *     tags: [Users]
 *     security:
 *       - TOKEN: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: User ID or "@me" to target the authenticated user
 *         schema:
 *           type: string
 *         example: "@me"
 *     responses:
 *       '204':
 *         description: User successfully deleted
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:userId', resolveMe, UserController.remove);

router.get('/:userId/todos', resolveMe, TodoController.list);
router.post('/:userId/todos', [resolveMe, validateBody(createTodoSchema)], TodoController.create);
router.patch('/:userId/todos/:todoId', [resolveMe, validateBody(updateTodoSchema)], TodoController.update);
router.delete('/:userId/todos/:todoId', resolveMe, TodoController.remove);

export default router;