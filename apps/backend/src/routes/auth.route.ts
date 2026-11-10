import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { validateBody } from '../middlewares/validate.middleware'
import { createUserSchema } from '../validators/user.schema'
import { authRateLimiter } from '../middlewares/rate-limit.middleware'

const router = Router();

router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

router.post('/register', authRateLimiter, validateBody(createUserSchema), AuthController.register);
router.post('/login', authRateLimiter, AuthController.login);
router.post('/logout', authMiddleware, AuthController.logout);

export default router;
