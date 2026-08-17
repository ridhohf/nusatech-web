import { prisma } from '../prisma';

export const inventoryService = {
  async getAll() {
    return prisma.inventory.findMany({
      include: { supplier: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: {
    jenisBarang: string;
    specBarang: string;
    kodeBarang: string;
    quantity: number;
    unitOfIssue: string;
    harga: number;
    supplierId?: string;
  }) {
    return prisma.inventory.create({ data, include: { supplier: true } });
  },

  async findById(id: string) {
    return prisma.inventory.findUnique({ where: { id }, include: { supplier: true } });
  },

  async updateStock(id: string, deltaQuantity: number) {
    return prisma.inventory.update({
      where: { id },
      data: {
        quantity: {
          increment: deltaQuantity,
        },
      },
    });
  },

  async delete(id: string) {
    await prisma.inspectionItem.deleteMany({ where: { inventoryId: id } });
    return prisma.inventory.delete({ where: { id } });
  },
};
