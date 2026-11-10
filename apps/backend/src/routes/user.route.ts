import { Router } from 'express'
import { UserController } from '../controllers/user.controller'
import { UserService } from '../services/user.service'
import { UserPolicy } from '../policies/user.policy'
import { authMiddleware } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import { resolveMe } from '../middlewares/resolve-me.middleware'
import { validateBody } from '../middlewares/validate.middleware'
import { updateUserSchema } from '../validators/user.schema'
import { updateUserPreferencesSchema } from '../validators/user-preferences.schema'
import todoRoutes from './todo.routes'

const router = Router();

router.use(authMiddleware);
router.param('userId', resolveMe);

router.get('/:userId', UserController.show);
router.patch('/:userId', [
    authorize(UserPolicy.update, req => UserService.findById(String(req.params.userId))),
    validateBody(updateUserSchema),
], UserController.update);
router.delete('/:userId', [
    authorize(UserPolicy.delete, req => UserService.findById(String(req.params.userId))),
], UserController.remove);

router.patch('/:userId/preferences', [
    authorize(UserPolicy.updatePreferences, req => UserService.findById(String(req.params.userId))),
    validateBody(updateUserPreferencesSchema),
], UserController.updatePreferences);

router.use('/:userId/todos', todoRoutes);

export default router;
