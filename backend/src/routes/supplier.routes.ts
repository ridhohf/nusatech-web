import { Router } from 'express';
import { getSuppliers, createSupplier } from '../controllers/supplier.controller';
import { validate } from '../middlewares/validate.middleware';
import { authorize } from '../middlewares/role.middleware';
import { supplierSchema } from '../validators/schemas';

const router = Router();
router.get('/', getSuppliers);
router.post('/', authorize('INTERNAL'), validate(supplierSchema), createSupplier);

export default router;
