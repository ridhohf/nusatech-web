import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service';
import { formatSuccess } from '../utils/response.util';

export const getInventory = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await inventoryService.getAll();
    res.json(formatSuccess(items));
  } catch (error) { next(error); }
};

export const createInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await inventoryService.create(req.body);
    res.status(201).json(formatSuccess(item, 'Barang berhasil ditambahkan'));
  } catch (error) { next(error); }
};

export const updateInventoryStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { deltaQuantity } = req.body;
    const item = await inventoryService.updateStock(id, Number(deltaQuantity) || 0);
    res.json(formatSuccess(item, 'Stok berhasil diperbarui'));
  } catch (error) { next(error); }
};

export const deleteInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await inventoryService.delete(id);
    res.json(formatSuccess(null, 'Barang berhasil dihapus'));
  } catch (error) { next(error); }
};
