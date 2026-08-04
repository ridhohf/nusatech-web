'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import Link from 'next/link';
import { PackageSearch, Wrench, CheckCircle, Clock, ArrowRight, Plus } from 'lucide-react';
import { StatCard } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { dataCache } from '@/utils/dataCache';

const SCOPE_NAMES: Record<string, string> = {
  '10': 'Overhaul Total',
  '20': 'Overhaul Partial',
  '30': 'Pengadaan Spare Part',
  '40': 'Tools',
};

const EQUIPMENT_NAMES: Record<string, string> = {
  '10': 'Pompa',
  '20': 'Motor Listrik',
  '30': 'Turbin',
  '40': 'Lain-lain',
};

const getProgress = (status: string): number => {
  switch (status) {
    case 'PENDING': return 10;
    case 'INSPEKSI': return 30;
    case 'WAITING_MATERIAL': return 45;
    case 'EKSEKUSI': return 65;
    case 'QC': return 85;
    case 'FINISH': return 100;
    default: return 10;
  }
};

export default function InternalDashboard() {
  const [inspections, setInspections] = useState<any[]>(() => dataCache.get('/inspections') || []);
  const [fetching, setFetching] = useState(!dataCache.get('/inspections'));

  const fetchData = async () => {
    const cached = dataCache.get('/inspections');
    if (cached) {
      setInspections(cached);
      setFetching(false);
    }

    try {
      const res = await apiClient.get('/inspections');
      const insData = res.data.data || res.data;
      setInspections(insData);
      dataCache.set('/inspections', insData);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const data = inspections || [];

  const waitingCount = data.filter(i => i.status === 'PENDING' || i.status === 'INSPEKSI').length;
  const inProgressCount = data.filter(i => i.status === 'EKSEKUSI' || i.status === 'QC').length;
  const waitingMaterialCount = data.filter(i => i.status === 'WAITING_MATERIAL').length;
  const finishedCount = data.filter(i => i.status === 'FINISH').length;

  const stats = [
    { title: 'Menunggu Inspeksi', value: waitingCount, icon: <Clock size={28} />, color: 'var(--blue-500)', bgColor: 'var(--blue-50)' },
    { title: 'Dalam Perbaikan', value: inProgressCount, icon: <Wrench size={28} />, color: '#c2410c', bgColor: '#ffedd5' },
    { title: 'Kekurangan Material', value: waitingMaterialCount, icon: <PackageSearch size={28} />, color: '#b91c1c', bgColor: '#fef2f2' },
    { title: 'Selesai (Semua)', value: finishedCount, icon: <CheckCircle size={28} />, color: '#15803d', bgColor: '#dcfce7' },
  ];

  // Ambil pekerjaan terbaru yang belum selesai
  const activeJobs = data
    .filter(i => i.status !== 'FINISH')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 4 Kolom dengan persentase lebar 100% presisi:
  // 1. ID PROJECT (18%)
  // 2. NAMA PROJECT (32%)
  // 3. CLIENT (22%)
  // 4. PROGRESS (28%)
  const columns = [
    {
      header: 'ID PROJECT',
      width: '18%',
      accessor: (row: any) => (
        <span style={{
          fontFamily: 'monospace',
          backgroundColor: 'var(--blue-100)',
          color: 'var(--blue-900)',
          padding: '0.25rem 0.6rem',
          borderRadius: '0.35rem',
          fontSize: '0.85rem',
          fontWeight: 800,
          letterSpacing: '0.02em',
          display: 'inline-block',
        }}>
          {row.projectCode || (row.company ? `${row.company.code}-1010` : `#${row.id.slice(-6).toUpperCase()}`)}
        </span>
      )
    },
    {
      header: 'NAMA PROJECT',
      width: '32%',
      accessor: (row: any) => {
        const scope = SCOPE_NAMES[row.scopeCode] || row.kategoriPerbaikan || 'Overhaul';
        const equip = EQUIPMENT_NAMES[row.equipmentCode] || 'Peralatan';
        return (
          <div style={{ fontWeight: 600, color: 'var(--blue-900)' }}>
            {scope} - {equip}
          </div>
        );
      }
    },
    {
      header: 'CLIENT',
      width: '22%',
      accessor: (row: any) => (
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {row.company ? row.company.name : 'Non-klien'}
        </span>
      )
    },
    {
      header: 'PROGRESS',
      width: '28%',
      accessor: (row: any) => {
        const pct = getProgress(row.status);
        const isFinish = pct === 100;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: '110px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem', color: isFinish ? '#16a34a' : 'var(--blue-800)' }}>
                <span>{row.status}</span>
                <span>{pct}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', backgroundColor: isFinish ? '#16a34a' : 'var(--blue-600)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            <Link href="/internal/repairs" style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--blue-600)',
              textDecoration: 'none',
              padding: '0.35rem 0.7rem',
              borderRadius: '0.35rem',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}>
              Detail <ArrowRight size={14} />
            </Link>
          </div>
        );
      }
    }
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Ringkasan status pekerjaan dan inventori secara real-time.</p>
        </div>
        <Link href="/internal/incoming" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <Plus size={18} /> Registrasi Proyek Baru
        </Link>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} value={stat.value.toString()} />
        ))}
      </div>

      {/* MAIN TABLE */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.25rem', color: 'var(--blue-900)' }}>Pekerjaan Aktif Terkini</h3>

        <DataTable columns={columns} data={activeJobs} keyExtractor={(r) => r.id} emptyMessage={fetching ? "Memuat data terbaru..." : "Tidak ada pekerjaan aktif"} />
      </div>
    </div>
  );
}
