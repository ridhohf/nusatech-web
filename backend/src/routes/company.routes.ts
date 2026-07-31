import { Router } from 'express';
import { getCompanies, createCompany } from '../controllers/company.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', getCompanies);
router.post('/', createCompany);

export default router;
