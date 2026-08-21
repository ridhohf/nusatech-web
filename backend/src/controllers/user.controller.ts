import { Request, Response, NextFunction } from 'express';
import { userService, supplierService } from '../services/misc.service';
import { authService } from '../services/auth.service';
import { formatSuccess } from '../utils/response.util';

export const getUsers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await userService.getAll();
    res.json(formatSuccess(data));
  } catch (error) { next(error); }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(formatSuccess(user, 'User berhasil dibuat'));
  } catch (error: any) {
    if (error.message === 'Email sudah terdaftar') return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

export const approveUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.approveUser(req.params.id as string);
    res.json(formatSuccess(user, 'Akun berhasil disetujui'));
  } catch (error) { next(error); }
};

export const updateUserCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { companyId } = req.body;
    const user = await userService.updateUserCompany(id, companyId || null);
    res.json(formatSuccess(user, 'Perusahaan klien berhasil diperbarui'));
  } catch (error) { next(error); }
};
