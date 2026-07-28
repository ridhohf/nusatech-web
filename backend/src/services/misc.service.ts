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
      select: { id: true, name: true, email: true, role: true, isApproved: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  },
  async approveUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isApproved: true },
      select: { id: true, name: true, email: true, role: true, isApproved: true },
    });
  },
};
