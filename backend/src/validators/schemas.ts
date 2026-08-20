import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['INTERNAL', 'CLIENT']),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  newPassword: z.string().min(6, 'Password minimal 6 karakter'),
});

export const inventorySchema = z.object({
  jenisBarang: z.string().min(1, 'Jenis barang wajib diisi'),
  specBarang: z.string().min(1, 'Spesifikasi wajib diisi'),
  kodeBarang: z.string().min(1, 'Kode barang wajib diisi'),
  quantity: z.number().int().min(0, 'Kuantitas tidak boleh negatif'),
  unitOfIssue: z.string().min(1, 'Satuan wajib diisi'),
  harga: z.number().min(0, 'Harga tidak boleh negatif'),
  supplierId: z.string().uuid('Supplier ID tidak valid').optional(),
});

export const inspectionSchema = z.object({
  picId: z.string().uuid('PIC ID tidak valid'),
  companyId: z.string().uuid('Company ID tidak valid').optional().nullable(),
  scopeCode: z.string().optional().nullable(),
  equipmentCode: z.string().optional().nullable(),
  kategoriPerbaikan: z.enum(['GANTI', 'FABRIKASI', 'REPAIR']).optional(),
  catatan: z.string().optional().nullable(),
  items: z.array(z.object({
    inventoryId: z.string().uuid(),
    quantityUsed: z.number().int().min(1),
  })).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'INSPEKSI', 'WAITING_MATERIAL', 'EKSEKUSI', 'QC', 'FINISH']),
  catatan: z.string().optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(2, 'Nama supplier minimal 2 karakter'),
  contact: z.string().optional(),
});
