'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { 
  X, TrendingUp, AlertTriangle, CheckCircle2, Clock, 
  Plus, Trash2, Save, RotateCcw, Calendar, DollarSign
} from 'lucide-react';

interface MilestoneRow {
  id?: string;
  taskName: string;
  qty: number | string;
  uom: string;
  unitPrice: number | string;
  totalPrice?: number;
  weight?: number;
  dailyPlanning: (string | number)[];
  dailyActual: (string | number)[];
}

interface SCurvePoint {
  dayIndex: number;
  dayLabel: string;
  plan: number;
  actual: number;
  deviation: number;
}

interface SCurveModalProps {
  inspection: any;
  isOpen: boolean;
  onClose: () => void;
  isReadOnly?: boolean;
}

export default function SCurveModal({ inspection, isOpen, onClose, isReadOnly = false }: SCurveModalProps) {
  const [durationDays, setDurationDays] = useState<number>(7);
  const [durationInput, setDurationInput] = useState<string>('7');
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [totalProjectValue, setTotalProjectValue] = useState<number>(0);
  const [matrixSummary, setMatrixSummary] = useState<{
    dailyPlanningSum: number[];
    dailyActualSum: number[];
    cumulativePlanning: number[];
    cumulativeActual: number[];
    aheadBehind: number[];
  }>({
    dailyPlanningSum: [],
    dailyActualSum: [],
    cumulativePlanning: [],
    cumulativeActual: [],
    aheadBehind: [],
  });

  const [currentPerformance, setCurrentPerformance] = useState<{
    totalActualProgress: number;
    totalPlanProgress: number;
    latestDeviation: number;
    status: 'AHEAD' | 'ON_SCHEDULE' | 'DELAYED';
  }>({
    totalActualProgress: 0,
    totalPlanProgress: 0,
    latestDeviation: 0,
    status: 'ON_SCHEDULE',
  });

  const [sCurveData, setSCurveData] = useState<SCurvePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // New item modal / form
  const [newTaskName, setNewTaskName] = useState('');
  const [newQty, setNewQty] = useState<number | string>(1);
  const [newUom, setNewUom] = useState('SET');
  const [newUnitPrice, setNewUnitPrice] = useState<number | string>('');

  const parseNum = (val: any): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    let str = String(val).trim();
    // If string has both dot and comma (e.g. "3.825.000,00" or "3,825,000.00")
    if (str.includes('.') && str.includes(',')) {
      if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
        // Format ID/EU: 3.825.000,00 -> hilangkan titik ribuan, koma jadi titik desimal
        str = str.replace(/\./g, '').replace(',', '.');
      } else {
        // Format US: 3,825,000.00 -> hilangkan koma ribuan
        str = str.replace(/,/g, '');
      }
    } else if ((str.match(/\./g) || []).length > 1) {
      // Banyak titik ribuan misal "3.825.000" -> hilangkan titik
      str = str.replace(/\./g, '');
    } else if ((str.match(/,/g) || []).length > 1) {
      // Banyak koma ribuan misal "3,825,000" -> hilangkan koma
      str = str.replace(/,/g, '');
    } else if (str.includes(',')) {
      // Koma desimal tunggal misal "11,27" -> "11.27"
      str = str.replace(',', '.');
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Recalculate summary metrics on client-side
  const recalculateLocal = (rows: MilestoneRow[], days: number) => {
    const sumVal = rows.reduce((s, r) => s + (parseNum(r.qty) * parseNum(r.unitPrice)), 0);
    setTotalProjectValue(sumVal);

    const rowsWithWeights = rows.map(r => {
      const rowTotal = parseNum(r.qty) * parseNum(r.unitPrice);
      const w = sumVal > 0 ? Math.round((rowTotal / sumVal) * 10000) / 100 : 0;
      return { ...r, totalPrice: rowTotal, weight: w };
    });

    const dailyPlanningSum: number[] = [];
    const dailyActualSum: number[] = [];
    const cumulativePlanning: number[] = [];
    const cumulativeActual: number[] = [];
    const aheadBehind: number[] = [];

    let runP = 0;
    let runA = 0;

    for (let day = 0; day < days; day++) {
      const pDay = rowsWithWeights.reduce((s, r) => s + parseNum(r.dailyPlanning?.[day]), 0);
      const aDay = rowsWithWeights.reduce((s, r) => s + parseNum(r.dailyActual?.[day]), 0);

      dailyPlanningSum.push(Math.round(pDay * 10000) / 100);
      dailyActualSum.push(Math.round(aDay * 10000) / 100);

      runP += pDay;
      runA += aDay;

      const cumP = Math.min(100, Math.round(runP * 10000) / 100);
      const cumA = Math.min(100, Math.round(runA * 10000) / 100);

      cumulativePlanning.push(cumP);
      cumulativeActual.push(cumA);

      const dev = Math.round((cumA - cumP) * 100) / 100;
      aheadBehind.push(dev);
    }

    setMatrixSummary({
      dailyPlanningSum,
      dailyActualSum,
      cumulativePlanning,
      cumulativeActual,
      aheadBehind,
    });

    const latestDev = aheadBehind.length > 0 ? aheadBehind[aheadBehind.length - 1] : 0;
    const totalAct = cumulativeActual.length > 0 ? cumulativeActual[cumulativeActual.length - 1] : 0;
    const totalPlan = cumulativePlanning.length > 0 ? cumulativePlanning[cumulativePlanning.length - 1] : 0;

    setCurrentPerformance({
      totalActualProgress: totalAct,
      totalPlanProgress: totalPlan,
      latestDeviation: latestDev,
      status: latestDev >= 0 ? (latestDev > 2 ? 'AHEAD' : 'ON_SCHEDULE') : 'DELAYED',
    });

    const newCurve: SCurvePoint[] = [
      { dayIndex: 0, dayLabel: 'Start', plan: 0, actual: 0, deviation: 0 },
      ...Array.from({ length: days }, (_, i) => ({
        dayIndex: i + 1,
        dayLabel: `H-${i + 1}`,
        plan: cumulativePlanning[i] || 0,
        actual: cumulativeActual[i] || 0,
        deviation: aheadBehind[i] || 0,
      })),
    ];
    setSCurveData(newCurve);
  };

  const fetchMilestones = async () => {
    if (!inspection?.id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/inspections/${inspection.id}/milestones`);
      const data = res.data.data || res.data;
      const days = data.durationDays || 7;
      setDurationDays(days);
      setDurationInput(String(days));

      const rawMilestones: MilestoneRow[] = (data.milestones || []).map((m: any) => ({
        ...m,
        qty: m.qty ?? 1,
        uom: m.uom || 'SET',
        unitPrice: m.unitPrice ?? 0,
        dailyPlanning: Array.isArray(m.dailyPlanning)
          ? m.dailyPlanning.map((v: any) => (v === 0 || v === null || v === undefined ? '' : String(v)))
          : Array(days).fill(''),
        dailyActual: Array.isArray(m.dailyActual)
          ? m.dailyActual.map((v: any) => (v === 0 || v === null || v === undefined ? '' : String(v)))
          : Array(days).fill(''),
      }));

      setMilestones(rawMilestones);
      recalculateLocal(rawMilestones, days);
    } catch (err) {
      console.error('Failed to fetch milestones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && inspection?.id) {
      fetchMilestones();
    }
  }, [isOpen, inspection?.id]);

  const handleDurationChange = (newDays: number) => {
    const val = Math.max(1, Math.min(60, newDays));
    setDurationDays(val);
    setDurationInput(String(val));

    const updated = milestones.map(m => {
      const pArr = Array.from({ length: val }, (_, i) => m.dailyPlanning?.[i] ?? '');
      const aArr = Array.from({ length: val }, (_, i) => m.dailyActual?.[i] ?? '');
      return { ...m, dailyPlanning: pArr, dailyActual: aArr };
    });
    setMilestones(updated);
    recalculateLocal(updated, val);
  };

  const handleCellChange = (rowIndex: number, type: 'P' | 'A', dayIndex: number, rawVal: string) => {
    // Allow digits, dots, commas, and negative signs only
    if (!/^[\d.,-]*$/.test(rawVal)) return;

    const updated = [...milestones];
    const target = { ...updated[rowIndex] };

    if (type === 'P') {
      const arr = [...(target.dailyPlanning || [])];
      arr[dayIndex] = rawVal;
      target.dailyPlanning = arr;
    } else {
      const arr = [...(target.dailyActual || [])];
      arr[dayIndex] = rawVal;
      target.dailyActual = arr;
    }

    updated[rowIndex] = target;
    setMilestones(updated);
    recalculateLocal(updated, durationDays);
  };

  const handleRowFieldChange = (rowIndex: number, field: 'taskName' | 'qty' | 'uom' | 'unitPrice', val: any) => {
    const updated = [...milestones];
    const target = { ...updated[rowIndex], [field]: val };
    const q = parseNum(target.qty);
    const u = parseNum(target.unitPrice);
    target.totalPrice = q * u;
    updated[rowIndex] = target;
    setMilestones(updated);
    recalculateLocal(updated, durationDays);
  };

  const handleAddRow = () => {
    if (!newTaskName.trim()) {
      alert('Silakan tuliskan Uraian Pekerjaan terlebih dahulu.');
      return;
    }

    const q = parseNum(newQty) || 1;
    const u = parseNum(newUnitPrice) || 0;
    const tot = q * u;

    const newRow: MilestoneRow = {
      taskName: newTaskName.trim(),
      qty: q,
      uom: newUom.trim() || 'SET',
      unitPrice: u,
      totalPrice: tot,
      dailyPlanning: Array(durationDays).fill(''),
      dailyActual: Array(durationDays).fill(''),
    };

    const updated = [...milestones, newRow];
    setMilestones(updated);
    setNewTaskName('');
    setNewQty(1);
    setNewUom('SET');
    setNewUnitPrice('');
    recalculateLocal(updated, durationDays);
  };

  const handleDeleteRow = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index);
    setMilestones(updated);
    recalculateLocal(updated, durationDays);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await apiClient.put(`/inspections/${inspection.id}/milestones/daily-matrix`, {
        durationDays,
        milestones: milestones.map(m => ({
          id: m.id,
          taskName: m.taskName,
          qty: parseNum(m.qty) || 1,
          uom: m.uom || 'SET',
          unitPrice: parseNum(m.unitPrice) || 0,
          totalPrice: (parseNum(m.qty) || 1) * (parseNum(m.unitPrice) || 0),
          dailyPlanning: (m.dailyPlanning || []).map(v => parseNum(v)),
          dailyActual: (m.dailyActual || []).map(v => parseNum(v)),
        })),
      });

      const data = res.data?.data || res.data;
      if (data && data.milestones) {
        setMilestones(data.milestones);
        if (data.durationDays) {
          setDurationDays(data.durationDays);
          setDurationInput(String(data.durationDays));
        }
        if (data.totalProjectValue !== undefined) setTotalProjectValue(data.totalProjectValue);
        if (data.matrixSummary) setMatrixSummary(data.matrixSummary);
        if (data.currentPerformance) setCurrentPerformance(data.currentPerformance);
      }

      alert('Matriks pengerjaan harian & Kurva-S berhasil disimpan!');
    } catch (err: any) {
      console.error('Failed to save daily matrix:', err);
      alert(err.response?.data?.message || err.message || 'Gagal menyimpan matriks pengerjaan');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Kosongkan semua rincian pekerjaan dan matriks harian proyek ini?')) return;
    setLoading(true);
    try {
      await apiClient.post(`/inspections/${inspection.id}/milestones/reset`);
      await fetchMilestones();
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !inspection) return null;

  const currentProjectCode = inspection.projectCode || `${inspection.company?.code || '6501'}-${inspection.scopeCode || '10'}${inspection.equipmentCode || '10'}`;

  // SVG Chart Geometry
  const svgWidth = 620;
  const svgHeight = 230;
  const paddingX = 45;
  const paddingY = 25;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const pointsCount = sCurveData.length || 2;
  const getX = (index: number) => paddingX + (index / (pointsCount - 1)) * chartW;
  const getY = (val: number) => paddingY + chartH - (Math.max(0, Math.min(100, val)) / 100) * chartH;

  const planPath = sCurveData.length > 0
    ? sCurveData.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.plan)}`, '')
    : '';

  const actualPath = sCurveData.length > 0
    ? sCurveData.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.actual)}`, '')
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <TrendingUp size={20} className="text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-blue-500/30 border border-blue-400/40 text-blue-100 px-2 py-0.5 rounded-md">
                  {currentProjectCode}
                </span>
                <span className="text-xs text-blue-200 font-medium">
                  {inspection.company ? inspection.company.name : 'Non-klien'}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">
                Manajemen Progres Workshop & Kurva-S Harian
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Save size={13} />
                <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* STATS METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            {/* CARD 1: NILAI TOTAL PROYEK */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                Total Nilai Pekerjaan (RAB)
              </span>
              <div className="text-xl font-black text-slate-900">
                Rp {totalProjectValue.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {milestones.length} item pekerjaan terdaftar
              </span>
            </div>

            {/* CARD 2: DURASI KERJA */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                Durasi Proyek Workshop
              </span>
              <div className="flex items-center gap-2">
                {!isReadOnly ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={durationInput}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (!/^\d*$/.test(raw)) return;
                        setDurationInput(raw);
                        if (raw !== '') {
                          const val = Math.max(1, Math.min(60, parseInt(raw, 10)));
                          handleDurationChange(val);
                        }
                      }}
                      onBlur={() => {
                        if (!durationInput || parseInt(durationInput, 10) < 1) {
                          setDurationInput(String(durationDays || 7));
                        }
                      }}
                      className="w-16 px-2 py-0.5 text-lg font-black text-blue-900 border border-blue-300 rounded-md bg-white text-center"
                    />
                    <span className="text-xs font-bold text-slate-700">Hari Kerja</span>
                  </div>
                ) : (
                  <div className="text-xl font-black text-blue-900">{durationDays} Hari Kerja</div>
                )}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Timeline matriks harian</span>
            </div>

            {/* CARD 3: PROGRES AKTUAL */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                Progres Aktual Realisasi
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-emerald-700">
                  {currentPerformance.totalActualProgress}%
                </span>
                <span className="text-[11px] text-slate-500">Target: {currentPerformance.totalPlanProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, currentPerformance.totalActualProgress)}%` }}
                />
              </div>
            </div>

            {/* CARD 4: STATUS DEVIASI */}
            <div className={`p-3.5 rounded-xl border ${
              currentPerformance.status === 'AHEAD' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : currentPerformance.status === 'DELAYED' 
                ? 'bg-rose-50 border-rose-200 text-rose-900' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <span className="text-[11px] font-semibold uppercase tracking-wider block mb-0.5">
                Deviasi Harian (Schedule Variance)
              </span>
              <div className="flex items-center gap-1.5">
                {currentPerformance.status === 'AHEAD' && <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />}
                {currentPerformance.status === 'DELAYED' && <AlertTriangle size={20} className="text-rose-600 shrink-0" />}
                {currentPerformance.status === 'ON_SCHEDULE' && <Clock size={20} className="text-amber-600 shrink-0" />}
                <span className="text-xl font-black">
                  {currentPerformance.latestDeviation > 0 
                    ? `+${currentPerformance.latestDeviation}%` 
                    : `${currentPerformance.latestDeviation}%`}
                </span>
              </div>
              <span className="text-[10px] font-bold mt-0.5 inline-block uppercase">
                {currentPerformance.status === 'AHEAD' && '🟢 Ahead of Schedule'}
                {currentPerformance.status === 'DELAYED' && '🔴 Behind Schedule (Terlambat)'}
                {currentPerformance.status === 'ON_SCHEDULE' && '🟡 On Schedule'}
              </span>
            </div>
          </div>

          {/* S-CURVE INTERACTIVE SVG GRAPH */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Grafik Kurva-S Progres Harian</h3>
                <p className="text-xs text-slate-500 m-0">Akumulasi Planning vs Realisasi Aktual dari Hari 1 s.d. Hari {durationDays}</p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-blue-700">
                  <span className="w-3 h-3 rounded-full bg-blue-600 inline-block border-2 border-white shadow-xs" />
                  <span>Akumulasi Planning</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border-2 border-white shadow-xs" />
                  <span>Akumulasi Aktual</span>
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto flex justify-center py-1">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[720px] h-auto">
                {/* Horizontal Grid lines */}
                {[0, 25, 50, 75, 100].map((val) => {
                  const y = getY(val);
                  return (
                    <g key={val}>
                      <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                      <text x={paddingX - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* Vertical Timeline Markers */}
                {sCurveData.map((pt, i) => {
                  const x = getX(i);
                  return (
                    <g key={i}>
                      <line x1={x} y1={paddingY} x2={x} y2={svgHeight - paddingY} stroke="#f1f5f9" />
                      <text x={x} y={svgHeight - 8} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">
                        {pt.dayLabel}
                      </text>
                    </g>
                  );
                })}

                {/* Plan Curve Line (Blue) */}
                <path d={planPath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {sCurveData.map((pt, i) => (
                  <circle key={`p-${i}`} cx={getX(i)} cy={getY(pt.plan)} r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                ))}

                {/* Actual Curve Line (Green) */}
                <path d={actualPath} fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                {sCurveData.map((pt, i) => (
                  <circle key={`a-${i}`} cx={getX(i)} cy={getY(pt.actual)} r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                ))}
              </svg>
            </div>
          </div>

          {/* MATRIKS HARIAN EXCEL-STYLE TABLE */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Matriks Jadwal & Progres Harian</h3>
                <p className="text-xs text-slate-500 m-0">
                  Input nilai progres Planning (P) dan Actual (A) per hari untuk setiap uraian pekerjaan
                </p>
              </div>

              {!isReadOnly && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Kosongkan Matriks</span>
                  </button>
                </div>
              )}
            </div>

            {/* TABEL MATRIKS */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-2 text-center w-8">NO</th>
                    <th className="py-2.5 px-3 min-w-[220px]">URAIAN PEKERJAAN</th>
                    <th className="py-2.5 px-2 text-center w-12">QTY</th>
                    <th className="py-2.5 px-2 text-center w-12">UOM</th>
                    <th className="py-2.5 px-3 text-right min-w-[130px] w-36">HARGA (Rp)</th>
                    <th className="py-2.5 px-2 text-center w-14">BOBOT</th>
                    <th className="py-2.5 px-2 text-center w-8">P/A</th>
                    {Array.from({ length: durationDays }, (_, i) => (
                      <th key={i} className="py-2.5 px-1.5 text-center w-14 bg-blue-50/50 text-blue-900 border-l border-slate-200">
                        H-{i + 1}
                      </th>
                    ))}
                    {!isReadOnly && <th className="py-2.5 px-2 text-center w-10">AKSI</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {milestones.map((m, rIdx) => {
                    const rowTotal = parseNum(m.qty) * parseNum(m.unitPrice);
                    const rowWeight = totalProjectValue > 0 ? Math.round((rowTotal / totalProjectValue) * 10000) / 100 : 0;

                    return (
                      <tr key={rIdx} className="hover:bg-slate-50/70 transition-colors">
                        {/* NO */}
                        <td className="py-2 px-2 text-center font-bold text-slate-500 align-top">
                          {rIdx + 1}
                        </td>

                        {/* URAIAN PEKERJAAN */}
                        <td className="py-2 px-3 align-top">
                          {!isReadOnly ? (
                            <input
                              type="text"
                              value={m.taskName}
                              onChange={(e) => handleRowFieldChange(rIdx, 'taskName', e.target.value)}
                              className="w-full text-xs font-semibold text-slate-900 bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                            />
                          ) : (
                            <span className="font-semibold text-slate-900">{m.taskName}</span>
                          )}
                        </td>

                        {/* QTY */}
                        <td className="py-2 px-2 text-center align-top">
                          {!isReadOnly ? (
                            <input
                              type="text"
                              inputMode="numeric"
                              value={m.qty ?? ''}
                              onChange={(e) => handleRowFieldChange(rIdx, 'qty', e.target.value)}
                              className="w-10 text-center text-xs font-medium border border-slate-200 rounded py-0.5"
                            />
                          ) : (
                            <span>{m.qty}</span>
                          )}
                        </td>

                        {/* UOM */}
                        <td className="py-2 px-2 text-center align-top">
                          {!isReadOnly ? (
                            <input
                              type="text"
                              value={m.uom}
                              onChange={(e) => handleRowFieldChange(rIdx, 'uom', e.target.value)}
                              className="w-12 text-center text-xs font-medium border border-slate-200 rounded py-0.5 uppercase"
                            />
                          ) : (
                            <span>{m.uom}</span>
                          )}
                        </td>

                        {/* HARGA */}
                        <td className="py-2 px-2 text-right align-top font-mono">
                          {!isReadOnly ? (
                            <input
                              type="text"
                              inputMode="numeric"
                              value={m.unitPrice ?? ''}
                              onChange={(e) => handleRowFieldChange(rIdx, 'unitPrice', e.target.value)}
                              className="w-full min-w-[110px] text-right text-xs font-mono font-medium border border-slate-200 rounded px-2 py-0.5 focus:border-blue-500 outline-none"
                            />
                          ) : (
                            <span>{(parseNum(m.unitPrice)).toLocaleString('id-ID')}</span>
                          )}
                        </td>

                        {/* BOBOT % */}
                        <td className="py-2 px-2 text-center align-top font-bold text-blue-900 bg-blue-50/40">
                          {rowWeight}%
                        </td>

                        {/* P/A MULTI-ROW CELLS */}
                        <td className="py-1 px-1 text-center font-bold text-[10px] text-slate-600 border-l border-slate-200">
                          <div className="py-0.5 text-blue-700">P</div>
                          <div className="py-0.5 text-emerald-700 border-t border-slate-100">A</div>
                        </td>

                        {/* DAILY CELLS (P & A) */}
                        {Array.from({ length: durationDays }, (_, dIdx) => {
                          const pVal = m.dailyPlanning?.[dIdx];
                          const aVal = m.dailyActual?.[dIdx];

                          return (
                            <td key={dIdx} className="py-1 px-1 text-center border-l border-slate-200">
                              <div className="py-0.5">
                                {!isReadOnly ? (
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={pVal !== undefined && pVal !== null ? pVal : ''}
                                    placeholder="0"
                                    onChange={(e) => handleCellChange(rIdx, 'P', dIdx, e.target.value)}
                                    className="w-12 text-center text-[11px] font-mono text-blue-800 bg-blue-50/30 border border-blue-200/60 rounded px-1 py-0.5 outline-none focus:bg-blue-100"
                                  />
                                ) : (
                                  <span className="text-[11px] font-mono text-blue-800">{pVal ? `${pVal}%` : '-'}</span>
                                )}
                              </div>

                              <div className="py-0.5 border-t border-slate-100">
                                {!isReadOnly ? (
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={aVal !== undefined && aVal !== null ? aVal : ''}
                                    placeholder="0"
                                    onChange={(e) => handleCellChange(rIdx, 'A', dIdx, e.target.value)}
                                    className="w-12 text-center text-[11px] font-mono text-emerald-800 bg-emerald-50/30 border border-emerald-200/60 rounded px-1 py-0.5 outline-none focus:bg-emerald-100"
                                  />
                                ) : (
                                  <span className="text-[11px] font-mono font-bold text-emerald-800">{aVal ? `${aVal}%` : '-'}</span>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* AKSI HAPUS ROW */}
                        {!isReadOnly && (
                          <td className="py-2 px-2 text-center align-middle border-l border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(rIdx)}
                              title="Hapus baris item"
                              className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}

                  {milestones.length === 0 && (
                    <tr>
                      <td colSpan={8 + durationDays} className="text-center py-6 text-slate-400">
                        Belum ada item pekerjaan WBS. Silakan tambahkan item di bawah ini.
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* SUMMARY ROWS AT FOOTER (EXCEL-STYLE) */}
                <tfoot className="bg-slate-100/90 font-bold divide-y divide-slate-200 border-t-2 border-slate-300">
                  {/* TOTAL PLANNING HARIAN */}
                  <tr>
                    <td colSpan={6} className="py-2 px-3 text-right text-blue-900">TOTAL PLANNING HARIAN (%)</td>
                    <td className="text-center text-blue-700 border-l border-slate-200">P</td>
                    {Array.from({ length: durationDays }, (_, dIdx) => (
                      <td key={dIdx} className="py-2 px-1 text-center font-mono text-blue-800 border-l border-slate-200">
                        {matrixSummary.dailyPlanningSum[dIdx] || 0}%
                      </td>
                    ))}
                    {!isReadOnly && <td />}
                  </tr>

                  {/* TOTAL ACTUAL HARIAN */}
                  <tr>
                    <td colSpan={6} className="py-2 px-3 text-right text-emerald-900">TOTAL ACTUAL HARIAN (%)</td>
                    <td className="text-center text-emerald-700 border-l border-slate-200">A</td>
                    {Array.from({ length: durationDays }, (_, dIdx) => (
                      <td key={dIdx} className="py-2 px-1 text-center font-mono text-emerald-800 border-l border-slate-200">
                        {matrixSummary.dailyActualSum[dIdx] || 0}%
                      </td>
                    ))}
                    {!isReadOnly && <td />}
                  </tr>

                  {/* AKUMULASI PLANNING */}
                  <tr className="bg-blue-100/70 text-blue-950">
                    <td colSpan={7} className="py-2 px-3 text-right">AKUMULASI PLANNING (%)</td>
                    {Array.from({ length: durationDays }, (_, dIdx) => (
                      <td key={dIdx} className="py-2 px-1 text-center font-mono font-black border-l border-blue-200">
                        {matrixSummary.cumulativePlanning[dIdx] || 0}%
                      </td>
                    ))}
                    {!isReadOnly && <td />}
                  </tr>

                  {/* AKUMULASI AKTUAL */}
                  <tr className="bg-emerald-100/70 text-emerald-950">
                    <td colSpan={7} className="py-2 px-3 text-right">AKUMULASI AKTUAL (%)</td>
                    {Array.from({ length: durationDays }, (_, dIdx) => (
                      <td key={dIdx} className="py-2 px-1 text-center font-mono font-black border-l border-emerald-200">
                        {matrixSummary.cumulativeActual[dIdx] || 0}%
                      </td>
                    ))}
                    {!isReadOnly && <td />}
                  </tr>

                  {/* AHEAD / BEHIND DEVIASI */}
                  <tr className="bg-slate-200/90">
                    <td colSpan={7} className="py-2 px-3 text-right text-slate-800">AHEAD / BEHIND DEVIASI (%)</td>
                    {Array.from({ length: durationDays }, (_, dIdx) => {
                      const dev = matrixSummary.aheadBehind[dIdx] || 0;
                      const isAhead = dev >= 0;

                      return (
                        <td key={dIdx} className={`py-2 px-1 text-center font-mono font-black border-l border-slate-300 ${
                          isAhead ? 'text-emerald-700 bg-emerald-200/50' : 'text-rose-700 bg-rose-200/50'
                        }`}>
                          {isAhead ? `+${dev}%` : `${dev}%`}
                        </td>
                      );
                    })}
                    {!isReadOnly && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* FORM TAMBAH BARIS PEKERJAAN BARU */}
            {!isReadOnly && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-end gap-2.5">
                <div className="flex-1 w-full">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Tambah Uraian Pekerjaan Baru</label>
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Contoh: Dynamic Balancing Impeller..."
                    className="form-input text-xs w-full"
                    style={{ height: '36px' }}
                  />
                </div>

                <div className="w-20">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Qty</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="form-input text-xs text-center w-full"
                    style={{ height: '36px' }}
                  />
                </div>

                <div className="w-24">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Satuan</label>
                  <input
                    type="text"
                    value={newUom}
                    onChange={(e) => setNewUom(e.target.value)}
                    className="form-input text-xs text-center w-full uppercase"
                    style={{ height: '36px' }}
                  />
                </div>

                <div className="min-w-[140px] w-44">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Harga Satuan (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(e.target.value)}
                    className="form-input text-xs text-right w-full font-mono"
                    style={{ height: '36px' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddRow}
                  className="btn btn-primary text-xs font-bold px-4 shrink-0"
                  style={{ height: '36px' }}
                >
                  <Plus size={14} /> Tambah Baris
                </button>
              </div>
            )}
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            💡 Sistem menghitung otomatis Bobot (%), Akumulasi Kumulatif, dan Kurva-S dari nilai yang Anda inputkan.
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn text-xs font-semibold px-5 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
