import { prisma } from '../prisma';

export const inspectionService = {
  async getAll(filter?: { companyId?: string | null; role?: string }) {
    const where: any = {};
    if (filter?.role === 'CLIENT') {
      if (filter.companyId) {
        where.companyId = filter.companyId;
      } else {
        // Jika akun klien belum dihubungkan ke perusahaan, jangan tampilkan data perusahaan lain
        return [];
      }
    }

    return prisma.inspection.findMany({
      where,
      include: {
        pic: { select: { id: true, name: true, email: true } },
        company: true,
        items: { include: { inventory: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: {
    picId: string;
    companyId?: string;
    scopeCode?: string; // AA: 10, 20, 30, 40
    equipmentCode?: string; // BB: 10, 20, 30, 40
    kategoriPerbaikan?: 'GANTI' | 'FABRIKASI' | 'REPAIR';
    catatan?: string;
    items?: { inventoryId: string; quantityUsed: number }[];
  }) {
    let projectCode: string | undefined = undefined;

    // Calculate Project Code AABB if company is selected
    if (data.companyId) {
      const company = await prisma.company.findUnique({ where: { id: data.companyId } });
      if (company) {
        const scope = data.scopeCode || '10';
        const equip = data.equipmentCode || '10';
        projectCode = `${company.code}-${scope}${equip}`; // e.g. "6501-1010"
      }
    }

    // Map scopeCode to kategoriPerbaikan enum if not provided directly
    let kategoriEnum: 'GANTI' | 'FABRIKASI' | 'REPAIR' = data.kategoriPerbaikan || 'REPAIR';
    if (!data.kategoriPerbaikan && data.scopeCode) {
      if (data.scopeCode === '30') kategoriEnum = 'GANTI';
      else if (data.scopeCode === '40') kategoriEnum = 'FABRIKASI';
      else kategoriEnum = 'REPAIR';
    }

    return prisma.$transaction(async (tx) => {
      // 1. Jika ada items, cek stok dan kurangi stok inventori
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          const inventory = await tx.inventory.findUnique({ where: { id: item.inventoryId } });
          if (!inventory) throw new Error(`Material dengan ID ${item.inventoryId} tidak ditemukan`);
          if (inventory.quantity < item.quantityUsed) {
            throw new Error(`Stok tidak cukup untuk ${inventory.kodeBarang}. Sisa: ${inventory.quantity}`);
          }
          // Kurangi stok
          await tx.inventory.update({
            where: { id: item.inventoryId },
            data: { quantity: { decrement: item.quantityUsed } },
          });
        }
      }

      // 2. Buat registrasi inspeksi dengan projectCode AABB
      return tx.inspection.create({
        data: {
          picId: data.picId,
          companyId: data.companyId,
          projectCode,
          scopeCode: data.scopeCode || '10',
          equipmentCode: data.equipmentCode || '10',
          kategoriPerbaikan: kategoriEnum,
          catatan: data.catatan,
          items: data.items && data.items.length > 0
            ? { create: data.items.map(i => ({ inventoryId: i.inventoryId, quantityUsed: i.quantityUsed })) }
            : undefined,
        },
        include: {
          pic: { select: { id: true, name: true } },
          company: true,
          items: { include: { inventory: true } },
        },
      });
    });
  },

  async updateStatus(id: string, status: string, catatan?: string, fotoBukti?: string) {
    return prisma.inspection.update({
      where: { id },
      data: { 
        status: status as any, 
        catatan,
        ...(fotoBukti && { fotoBukti })
      },
      include: {
        pic: { select: { id: true, name: true } },
        company: true,
        items: { include: { inventory: true } },
      },
    });
  },

  async updateMaterialStatus(itemId: string, statusMaterial: string) {
    return prisma.inspectionItem.update({
      where: { id: itemId },
      data: { statusMaterial: statusMaterial as any },
    });
  },

  async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.inspectionItem.deleteMany({ where: { inspectionId: id } });
      return tx.inspection.delete({ where: { id } });
    });
  },
};
