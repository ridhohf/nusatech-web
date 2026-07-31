import { prisma } from '../prisma';

export const inspectionService = {
  async getAll() {
    return prisma.inspection.findMany({
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
    kategoriPerbaikan: 'GANTI' | 'FABRIKASI' | 'REPAIR';
    catatan?: string;
    items?: { inventoryId: string; quantityUsed: number }[];
  }) {
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

      // 2. Buat inspeksinya
      return tx.inspection.create({
        data: {
          picId: data.picId,
          companyId: data.companyId,
          kategoriPerbaikan: data.kategoriPerbaikan,
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
};
