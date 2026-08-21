import { Router } from 'express';
import { getUsers, createUser, approveUser, updateUserCompany } from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import { authorize } from '../middlewares/role.middleware';
import { registerSchema } from '../validators/schemas';

const router = Router();
router.get('/', authorize('INTERNAL'), getUsers);
router.post('/', authorize('INTERNAL'), validate(registerSchema), createUser);
router.patch('/:id/approve', authorize('INTERNAL'), approveUser);
router.patch('/:id/company', authorize('INTERNAL'), updateUserCompany);

export default router;
