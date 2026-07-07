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
};
