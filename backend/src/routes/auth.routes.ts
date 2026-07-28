import { Router } from 'express';
import { login, register, forgotPassword } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { loginSchema, registerSchema, forgotPasswordSchema } from '../validators/schemas';

const router = Router();
router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

export default router;
