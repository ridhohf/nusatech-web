import { Router } from 'express';
import { getInventory, createInventory } from '../controllers/inventory.controller';
import { validate } from '../middlewares/validate.middleware';
import { authorize } from '../middlewares/role.middleware';
import { inventorySchema } from '../validators/schemas';

const router = Router();
router.get('/', getInventory);
router.post('/', authorize('INTERNAL'), validate(inventorySchema), createInventory);

export default router;
