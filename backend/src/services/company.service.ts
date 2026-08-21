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
    // 1. Tentukan wilayah (Region): Manual selection atau Smart NLP Detection
    let region = '65'; // Default: Riau 65

    if (data.regionCode === '51') {
      region = '51'; // Manual: Sumbar
    } else if (data.regionCode === '65') {
      region = '65'; // Manual: Riau
    } else {
      // Smart Auto-Detection dari kata kunci Alamat & Nama Perusahaan
      const fullText = `${data.name || ''} ${data.address || ''}`.toLowerCase();
      
      const sumbarRegex = /sumbar|sumatera barat|padang|bukittinggi|payakumbuh|solok|sawahlunto|pariaman|padang panjang|pasaman|agam|dharmasraya|pesisir selatan|sijunjung|tanah datar|limapuluh kota|indarung/i;
      const riauRegex = /riau|pekanbaru|dumai|duri|siak|kampar|pelalawan|bengkalis|rohil|rokan hilir|rohul|rokan hulu|kuansing|kuantan singingi|indragiri|inhil|inhu|meranti/i;

      if (sumbarRegex.test(fullText)) {
        region = '51';
      } else if (riauRegex.test(fullText)) {
        region = '65';
      }
    }

    // 2. Cari perusahaan dengan awalan kode wilayah tersebut untuk menghitung nomor urut selanjutnya
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
