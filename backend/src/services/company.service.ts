import { prisma } from '../prisma';

export const companyService = {
  async getAllCompanies() {
    return prisma.company.findMany({
      orderBy: { code: 'asc' },
    });
  },

  async createCompany(data: { name: string; contact?: string; phone?: string; address?: string }) {
    // Calculate sequential unique 3-digit code (e.g. 001, 002, 003...)
    const count = await prisma.company.count();
    const lastCompany = await prisma.company.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    let nextNumber = count + 1;
    if (lastCompany && !isNaN(parseInt(lastCompany.code, 10))) {
      nextNumber = Math.max(nextNumber, parseInt(lastCompany.code, 10) + 1);
    }

    const formattedCode = String(nextNumber).padStart(3, '0');

    return prisma.company.create({
      data: {
        code: formattedCode,
        name: data.name,
        contact: data.contact,
        phone: data.phone,
        address: data.address,
      },
    });
  },
};
