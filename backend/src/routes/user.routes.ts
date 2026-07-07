import { Router } from 'express';
import { getUsers, createUser } from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import { authorize } from '../middlewares/role.middleware';
import { registerSchema } from '../validators/schemas';

const router = Router();
router.get('/', authorize('INTERNAL'), getUsers);
router.post('/', authorize('INTERNAL'), validate(registerSchema), createUser);

export default router;
