import { prisma } from '../prisma';

export const supplierService = {
  async getAll() {
    return prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } });
  },
  async create(data: { name: string; contact?: string }) {
    return prisma.supplier.create({ data });
  },
};

export const userService = {
  async getAll() {
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  },
};
