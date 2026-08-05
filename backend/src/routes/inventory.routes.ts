import { Router } from 'express';
import { getInventory, createInventory, updateInventoryStock, deleteInventory } from '../controllers/inventory.controller';
import { validate } from '../middlewares/validate.middleware';
import { authorize } from '../middlewares/role.middleware';
import { inventorySchema } from '../validators/schemas';

const router = Router();
router.get('/', getInventory);
router.post('/', authorize('INTERNAL'), validate(inventorySchema), createInventory);
router.patch('/:id/stock', authorize('INTERNAL'), updateInventoryStock);
router.delete('/:id', authorize('INTERNAL'), deleteInventory);

export default router;
