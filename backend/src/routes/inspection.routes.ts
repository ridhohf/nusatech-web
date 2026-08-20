import { Router } from 'express';
import { getInspections, createInspection, updateInspectionStatus, updateMaterialStatus, deleteInspection } from '../controllers/inspection.controller';
import { 
  getMilestones, 
  updateDailyMatrix, 
  addMilestoneRow, 
  deleteMilestoneRow, 
  resetMilestones 
} from '../controllers/milestone.controller';
import { validate } from '../middlewares/validate.middleware';
import { authorize } from '../middlewares/role.middleware';
import { upload } from '../middlewares/upload.middleware';
import { inspectionSchema } from '../validators/schemas';

const router = Router();
router.get('/', getInspections);
router.post('/', authorize('INTERNAL'), validate(inspectionSchema), createInspection);
router.put('/:id/status', authorize('INTERNAL'), upload.single('fotoBukti'), updateInspectionStatus);
router.put('/items/:id/status', authorize('INTERNAL'), updateMaterialStatus);
router.delete('/:id', authorize('INTERNAL'), deleteInspection);

// Milestone & Daily S-Curve Progress Tracking Routes (Pilar 2)
router.get('/:id/milestones', getMilestones);
router.put('/:id/milestones/daily-matrix', authorize('INTERNAL'), updateDailyMatrix);
router.post('/:id/milestones/row', authorize('INTERNAL'), addMilestoneRow);
router.delete('/:id/milestones/:milestoneId', authorize('INTERNAL'), deleteMilestoneRow);
router.post('/:id/milestones/reset', authorize('INTERNAL'), resetMilestones);

export default router;
