import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');
  
  // 1. Find or create PIC (Internal Admin)
  let pic = await prisma.user.findFirst({
    where: { role: 'INTERNAL' },
  });

  if (!pic) {
    pic = await prisma.user.findFirst();
  }

  if (!pic) {
    throw new Error('No user found in database. Please create a user first.');
  }

  console.log(`Using PIC: ${pic.name} (${pic.id})`);

  // 2. Find or create PT. Medco Power Service Indonesia
  let company = await prisma.company.findFirst({
    where: { name: { contains: 'Medco', mode: 'insensitive' } },
  });

  if (!company) {
    // Generate next company code for Riau (65)
    const regionalCompanies = await prisma.company.findMany({
      where: { code: { startsWith: '65' } },
      orderBy: { code: 'desc' },
    });

    let nextSeq = 1;
    if (regionalCompanies.length > 0) {
      const topCode = regionalCompanies[0].code;
      const seqPart = parseInt(topCode.slice(2), 10);
      if (!isNaN(seqPart)) nextSeq = seqPart + 1;
    }

    const code = `65${String(nextSeq).padStart(2, '0')}`;

    company = await prisma.company.create({
      data: {
        name: 'PT. Medco Power Service Indonesia',
        code,
        regionCode: '65',
        address: 'Kawasan Industri Riau / Pekanbaru',
        contact: 'Bpk. Hendra (Procurement & Maintenance)',
        phone: '0812-7654-3210',
      },
    });
    console.log(`Created Company: ${company.name} [${company.code}]`);
  } else {
    console.log(`Found existing Company: ${company.name} [${company.code}]`);
  }

  // 3. Create Project Inspection: Repair Shaft Assy Pump Disposal A - 1
  const scopeCode = '20'; // Overhaul Partial / Repair
  const equipmentCode = '10'; // Pompa
  const projectCode = `${company.code}-${scopeCode}${equipmentCode}`;

  const inspection = await prisma.inspection.create({
    data: {
      picId: pic.id,
      companyId: company.id,
      projectCode,
      scopeCode,
      equipmentCode,
      kategoriPerbaikan: 'REPAIR',
      status: 'EKSEKUSI',
      catatan: 'Repair Shaft Assy Pump Disposal A - 1 (Durasi: 7 Hari, Total Nilai: Rp 12.220.000)',
    },
  });

  console.log(`Created Inspection Project: [${inspection.projectCode}] ID: ${inspection.id}`);

  // 4. Create Custom WBS Milestones from the user's Excel sheet
  const milestonesData = [
    {
      taskName: 'Weld Repair & Machining - Pump Shaft 70 x 1105 mm (Material SUS-304)',
      weight: 31.3,
      progress: 100, // Completed
      planWeek: 1,
      order: 1,
      status: 'COMPLETED' as const,
    },
    {
      taskName: 'Rekondisi Gland Plate Mechanical Seal - Shaft Assy. #1',
      weight: 11.3,
      progress: 100, // Completed
      planWeek: 1,
      order: 2,
      status: 'COMPLETED' as const,
    },
    {
      taskName: 'Dynamic Balancing Impeller (Shaft Assy.) - Shaft Assy. #1',
      weight: 26.3,
      progress: 60, // In Progress
      planWeek: 1,
      order: 3,
      status: 'IN_PROGRESS' as const,
    },
    {
      taskName: 'New Fabrikasi Shaft Sleeve 42 x 110 mm (Material SUS-304)',
      weight: 23.0,
      progress: 30, // In Progress
      planWeek: 2,
      order: 4,
      status: 'IN_PROGRESS' as const,
    },
    {
      taskName: 'Finishing, Final QC & Packing',
      weight: 8.1,
      progress: 0, // Pending
      planWeek: 2,
      order: 5,
      status: 'PENDING' as const,
    },
  ];

  for (const m of milestonesData) {
    await prisma.projectMilestone.create({
      data: {
        inspectionId: inspection.id,
        taskName: m.taskName,
        weight: m.weight,
        progress: m.progress,
        planWeek: m.planWeek,
        order: m.order,
        status: m.status,
      },
    });
  }

  console.log('Successfully inserted all 5 WBS Milestones with custom weights and progress!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
