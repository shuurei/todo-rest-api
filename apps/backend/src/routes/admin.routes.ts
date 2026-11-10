import { Router } from 'express'
import { AdminController } from '../controllers/admin.controller'
import { UserController } from '../controllers/user.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import { validateBody } from '../middlewares/validate.middleware'
import { AdminPolicy } from '../policies/admin.policy'
import { adminUpdateUserSchema } from '../validators/admin.schema'

const router = Router();

// Current privileges are read from the database on every admin request.
router.use(authMiddleware, authorize(AdminPolicy.manageUsers, () => undefined));
router.get('/users', AdminController.searchUsers);
router.patch('/users/:userId', validateBody(adminUpdateUserSchema), AdminController.updateUser);
router.delete('/users/:userId', UserController.remove);
router.post('/users/:userId/restore', AdminController.restoreUser);

export default router;
