import { Router } from 'express';
import { getInspections, createInspection, updateInspectionStatus, updateMaterialStatus } from '../controllers/inspection.controller';
import { validate } from '../middlewares/validate.middleware';
import { authorize } from '../middlewares/role.middleware';
import { upload } from '../middlewares/upload.middleware';
import { inspectionSchema } from '../validators/schemas';

const router = Router();
router.get('/', getInspections);
router.post('/', authorize('INTERNAL'), validate(inspectionSchema), createInspection);
router.put('/:id/status', authorize('INTERNAL'), upload.single('fotoBukti'), updateInspectionStatus);
router.put('/items/:id/status', authorize('INTERNAL'), updateMaterialStatus);

export default router;
