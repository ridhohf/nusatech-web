import { Request, Response, NextFunction } from 'express';
import { milestoneService } from '../services/milestone.service';
import { formatSuccess } from '../utils/response.util';
import { AuthRequest } from '../types';
import { prisma } from '../prisma';

export const getMilestones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inspectionId = req.params.id as string;
    const authReq = req as AuthRequest;
    const user = authReq.user;

    if (user?.role === 'CLIENT') {
      let companyId = user.companyId;
      if (!companyId) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { companyId: true } });
        companyId = dbUser?.companyId;
      }

      const inspection = await prisma.inspection.findUnique({
        where: { id: inspectionId },
        select: { companyId: true }
      });

      if (!inspection || !companyId || inspection.companyId !== companyId) {
        return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke proyek ini' });
      }
    }

    const data = await milestoneService.getByInspectionId(inspectionId);
    res.json(formatSuccess(data));
  } catch (error) {
    next(error);
  }
};

export const updateDailyMatrix = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inspectionId = req.params.id as string;
    const data = await milestoneService.updateDailyMatrix(inspectionId, req.body);
    res.json(formatSuccess(data, 'Matriks progres harian berhasil disimpan'));
  } catch (error) {
    next(error);
  }
};

export const addMilestoneRow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inspectionId = req.params.id as string;
    const data = await milestoneService.addMilestoneRow(inspectionId, req.body);
    res.status(201).json(formatSuccess(data, 'Item pekerjaan berhasil ditambahkan'));
  } catch (error) {
    next(error);
  }
};

export const deleteMilestoneRow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inspectionId = req.params.id as string;
    const milestoneId = req.params.milestoneId as string;
    const data = await milestoneService.deleteMilestoneRow(inspectionId, milestoneId);
    res.json(formatSuccess(data, 'Item pekerjaan berhasil dihapus'));
  } catch (error) {
    next(error);
  }
};

export const resetMilestones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inspectionId = req.params.id as string;
    const data = await milestoneService.resetToEmpty(inspectionId);
    res.json(formatSuccess(data, 'Matriks pengerjaan berhasil dikosongkan'));
  } catch (error) {
    next(error);
  }
};
