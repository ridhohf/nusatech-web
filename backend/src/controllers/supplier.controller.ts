import { Request, Response, NextFunction } from 'express';
import { supplierService } from '../services/misc.service';
import { formatSuccess } from '../utils/response.util';

export const getSuppliers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await supplierService.getAll();
    res.json(formatSuccess(data));
  } catch (error) { next(error); }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await supplierService.create(req.body);
    res.status(201).json(formatSuccess(data, 'Supplier berhasil ditambahkan'));
  } catch (error) { next(error); }
};
