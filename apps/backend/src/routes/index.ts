import { Router } from 'express'
import authRoutes from './auth.route'
import userRoutes from './user.route'
import adminRoutes from './admin.routes'

const router = Router();

router.get('/health', (_req, res) => res.status(200).json({ status: 'OK' }));
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/admin', adminRoutes);

export default router;
