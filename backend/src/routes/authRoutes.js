import { Router } from 'express';
import { login } from '../controllers/authController.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.post('/login', authLimiter, login);

export default router;
