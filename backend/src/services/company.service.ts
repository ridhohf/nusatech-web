import { prisma } from '../prisma';

export const companyService = {
  async getAllCompanies() {
    return prisma.company.findMany({
      orderBy: { code: 'asc' },
    });
  },

  async createCompany(data: {
    name: string;
    address?: string;
    contact?: string;
    phone?: string;
    npwp?: string;
    regionCode?: string;
  }) {
    // Detect region automatically if address contains sumbar/padang or regionCode === '51'
    let region = '65'; // Default Riau 65
    if (data.regionCode === '51') {
      region = '51';
    } else if (data.address && /sumbar|padang|bukittinggi|payakumbuh|solok/i.test(data.address)) {
      region = '51';
    }

    // Find companies with code starting with the specified region code
    const regionalCompanies = await prisma.company.findMany({
      where: {
        code: {
          startsWith: region,
        },
      },
      orderBy: {
        code: 'desc',
      },
    });

    let nextSeq = 1;
    if (regionalCompanies.length > 0) {
      const topCode = regionalCompanies[0].code;
      const seqPart = parseInt(topCode.slice(region.length), 10);
      if (!isNaN(seqPart)) {
        nextSeq = seqPart + 1;
      }
    }

    const formattedCode = `${region}${String(nextSeq).padStart(2, '0')}`; // e.g. "6501", "6502", "5101"

    return prisma.company.create({
      data: {
        code: formattedCode,
        regionCode: region,
        name: data.name,
        address: data.address,
        contact: data.contact,
        phone: data.phone,
        npwp: data.npwp,
      },
    });
  },
};
