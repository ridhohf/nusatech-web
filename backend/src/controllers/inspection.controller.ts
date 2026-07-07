import { Request, Response, NextFunction } from 'express';
import { inspectionService } from '../services/inspection.service';
import { formatSuccess } from '../utils/response.util';
import { supabase } from '../utils/supabase';

export const getInspections = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await inspectionService.getAll();
    res.json(formatSuccess(data));
  } catch (error) { next(error); }
};

export const createInspection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await inspectionService.create(req.body);
    res.status(201).json(formatSuccess(data, 'Inspeksi berhasil dibuat'));
  } catch (error) { next(error); }
};

export const updateInspectionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status, catatan } = req.body;
    let fotoBukti = undefined;
    
    // Validate manually since we removed validate(schema) middleware for this route due to FormData
    if (!status) return res.status(422).json({ success: false, message: 'Status wajib diisi' });
    
    // Handle Supabase Upload if file exists
    if (req.file) {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ success: false, message: 'Konfigurasi Supabase belum disetting di backend' });
      }

      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('inspections')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase Upload Error:', uploadError);
        return res.status(500).json({ success: false, message: 'Gagal mengunggah foto ke Supabase' });
      }

      const { data: publicUrlData } = supabase.storage
        .from('inspections')
        .getPublicUrl(fileName);

      fotoBukti = publicUrlData.publicUrl;
    }

    const data = await inspectionService.updateStatus(id, status, catatan, fotoBukti);
    res.json(formatSuccess(data, 'Status berhasil diperbarui'));
  } catch (error) { next(error); }
};

export const updateMaterialStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = await inspectionService.updateMaterialStatus(id, req.body.statusMaterial);
    res.json(formatSuccess(data, 'Status material diperbarui'));
  } catch (error) { next(error); }
};
