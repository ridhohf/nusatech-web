import { prisma } from '../prisma';

export const milestoneService = {
  async getByInspectionId(inspectionId: string) {
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        company: true,
        pic: { select: { id: true, name: true, email: true } },
      },
    });

    if (!inspection) throw new Error('Proyek tidak ditemukan');

    const durationDays = inspection.durationDays || 7;

    const milestones = await prisma.projectMilestone.findMany({
      where: { inspectionId },
      orderBy: { order: 'asc' },
    });

    // Calculate total project value from all milestones (or fallback)
    const sumTotalPrice = milestones.reduce((sum, m) => sum + (m.totalPrice || 0), 0);

    // Calculate weights dynamically for each milestone
    const formattedMilestones = milestones.map((m) => {
      const calculatedWeight = sumTotalPrice > 0 
        ? Math.round(((m.totalPrice || 0) / sumTotalPrice) * 10000) / 100 
        : m.weight || 0;

      const dailyP: number[] = Array.isArray(m.dailyPlanning) 
        ? (m.dailyPlanning as number[]) 
        : Array(durationDays).fill(0);
      const dailyA: number[] = Array.isArray(m.dailyActual) 
        ? (m.dailyActual as number[]) 
        : Array(durationDays).fill(0);

      // Adjust arrays length to match durationDays
      const pArray = Array.from({ length: durationDays }, (_, i) => dailyP[i] || 0);
      const aArray = Array.from({ length: durationDays }, (_, i) => dailyA[i] || 0);

      // Total progress completed for this item
      const itemActualSum = aArray.reduce((s, v) => s + v, 0);
      const itemPlanSum = pArray.reduce((s, v) => s + v, 0);

      return {
        ...m,
        weight: calculatedWeight,
        dailyPlanning: pArray,
        dailyActual: aArray,
        itemActualSum: Math.round(itemActualSum * 100) / 100,
        itemPlanSum: Math.round(itemPlanSum * 100) / 100,
      };
    });

    // Daily Aggregations (Hari 1 s.d. Hari N)
    const dailyPlanningSum: number[] = [];
    const dailyActualSum: number[] = [];
    const cumulativePlanning: number[] = [];
    const cumulativeActual: number[] = [];
    const aheadBehind: number[] = [];

    let runPlan = 0;
    let runAct = 0;

    for (let day = 0; day < durationDays; day++) {
      const pDay = formattedMilestones.reduce((s, m) => s + (m.dailyPlanning[day] || 0), 0);
      const aDay = formattedMilestones.reduce((s, m) => s + (m.dailyActual[day] || 0), 0);

      dailyPlanningSum.push(Math.round(pDay * 10000) / 100); // e.g. 12.42%
      dailyActualSum.push(Math.round(aDay * 10000) / 100);

      runPlan += pDay;
      runAct += aDay;

      const cumP = Math.min(100, Math.round(runPlan * 10000) / 100);
      const cumA = Math.min(100, Math.round(runAct * 10000) / 100);

      cumulativePlanning.push(cumP);
      cumulativeActual.push(cumA);

      // Deviation in %
      const dev = Math.round((cumA - cumP) * 100) / 100;
      aheadBehind.push(dev);
    }

    // S-Curve Points for SVG Chart
    const sCurveData = [
      { dayIndex: 0, dayLabel: 'Start', plan: 0, actual: 0, deviation: 0 },
      ...Array.from({ length: durationDays }, (_, i) => ({
        dayIndex: i + 1,
        dayLabel: `H-${i + 1}`,
        plan: cumulativePlanning[i] || 0,
        actual: cumulativeActual[i] || 0,
        deviation: aheadBehind[i] || 0,
      })),
    ];

    // Current latest day with actual progress
    const latestActualDay = aheadBehind.length > 0 ? aheadBehind[aheadBehind.length - 1] : 0;
    const totalActualProgress = cumulativeActual.length > 0 ? cumulativeActual[cumulativeActual.length - 1] : 0;
    const totalPlanProgress = cumulativePlanning.length > 0 ? cumulativePlanning[cumulativePlanning.length - 1] : 0;

    return {
      inspection,
      durationDays,
      totalProjectValue: sumTotalPrice || inspection.totalPrice || 0,
      milestones: formattedMilestones,
      matrixSummary: {
        dailyPlanningSum,
        dailyActualSum,
        cumulativePlanning,
        cumulativeActual,
        aheadBehind,
      },
      currentPerformance: {
        totalActualProgress,
        totalPlanProgress,
        latestDeviation: latestActualDay,
        status: latestActualDay >= 0 ? (latestActualDay > 2 ? 'AHEAD' : 'ON_SCHEDULE') : 'DELAYED',
      },
      sCurveData,
    };
  },

  async updateDailyMatrix(inspectionId: string, payload: {
    durationDays?: number;
    milestones: {
      id?: string;
      taskName: string;
      qty: number;
      uom: string;
      unitPrice: number;
      totalPrice?: number;
      dailyPlanning: (number | string)[];
      dailyActual: (number | string)[];
    }[];
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Update durationDays on inspection if changed
      if (payload.durationDays) {
        await tx.inspection.update({
          where: { id: inspectionId },
          data: { durationDays: Number(payload.durationDays) || 7 },
        });
      }

      // 2. Fetch existing milestone IDs for this inspection
      const existing = await tx.projectMilestone.findMany({
        where: { inspectionId },
        select: { id: true },
      });
      const existingIdSet = new Set(existing.map(e => e.id));

      const validIncomingIds = (payload.milestones || [])
        .filter(m => m.id && existingIdSet.has(m.id))
        .map(m => m.id as string);

      // Delete any existing milestone that is no longer in validIncomingIds
      await tx.projectMilestone.deleteMany({
        where: {
          inspectionId,
          id: { notIn: validIncomingIds },
        },
      });

      // 3. Upsert / Create milestones
      for (let idx = 0; idx < (payload.milestones || []).length; idx++) {
        const item = payload.milestones[idx];
        const qty = Number(item.qty) || 1;
        const unitPrice = Number(item.unitPrice) || 0;
        const totalPrice = item.totalPrice !== undefined ? Number(item.totalPrice) : qty * unitPrice;
        
        // Clean dailyPlanning & dailyActual arrays into numbers
        const cleanPlanning = (item.dailyPlanning || []).map(v => {
          if (typeof v === 'number') return isNaN(v) ? 0 : v;
          const p = parseFloat(String(v).replace(',', '.'));
          return isNaN(p) ? 0 : p;
        });
        const cleanActual = (item.dailyActual || []).map(v => {
          if (typeof v === 'number') return isNaN(v) ? 0 : v;
          const p = parseFloat(String(v).replace(',', '.'));
          return isNaN(p) ? 0 : p;
        });

        if (item.id && existingIdSet.has(item.id)) {
          await tx.projectMilestone.update({
            where: { id: item.id },
            data: {
              taskName: item.taskName || `Pekerjaan ${idx + 1}`,
              qty,
              uom: item.uom || 'SET',
              unitPrice,
              totalPrice,
              order: idx + 1,
              dailyPlanning: cleanPlanning,
              dailyActual: cleanActual,
            },
          });
        } else {
          await tx.projectMilestone.create({
            data: {
              inspectionId,
              taskName: item.taskName || `Pekerjaan ${idx + 1}`,
              qty,
              uom: item.uom || 'SET',
              unitPrice,
              totalPrice,
              order: idx + 1,
              dailyPlanning: cleanPlanning,
              dailyActual: cleanActual,
            },
          });
        }
      }

      // 4. Update total project value on inspection
      const allMilestones = await tx.projectMilestone.findMany({ where: { inspectionId } });
      const grandTotal = allMilestones.reduce((s, m) => s + (m.totalPrice || 0), 0);
      await tx.inspection.update({
        where: { id: inspectionId },
        data: { totalPrice: grandTotal },
      });

      return this.getByInspectionId(inspectionId);
    });
  },

  async addMilestoneRow(inspectionId: string, data: {
    taskName: string;
    qty?: number;
    uom?: string;
    unitPrice?: number;
  }) {
    const inspection = await prisma.inspection.findUnique({ where: { id: inspectionId } });
    const durationDays = inspection?.durationDays || 7;
    const qty = data.qty || 1;
    const unitPrice = data.unitPrice || 0;
    const totalPrice = qty * unitPrice;

    const count = await prisma.projectMilestone.count({ where: { inspectionId } });

    await prisma.projectMilestone.create({
      data: {
        inspectionId,
        taskName: data.taskName,
        qty,
        uom: data.uom || 'SET',
        unitPrice,
        totalPrice,
        order: count + 1,
        dailyPlanning: Array(durationDays).fill(0),
        dailyActual: Array(durationDays).fill(0),
      },
    });

    return this.getByInspectionId(inspectionId);
  },

  async deleteMilestoneRow(inspectionId: string, milestoneId: string) {
    await prisma.projectMilestone.delete({ where: { id: milestoneId } });
    return this.getByInspectionId(inspectionId);
  },

  async resetToEmpty(inspectionId: string) {
    await prisma.projectMilestone.deleteMany({ where: { inspectionId } });
    return this.getByInspectionId(inspectionId);
  },
};
