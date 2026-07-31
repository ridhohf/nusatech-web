'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { PackageSearch, Wrench, CheckCircle, Clock } from 'lucide-react';
import { StatCard } from '@/components/ui/Card';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { formatDate } from '@/utils/format';
import { dataCache } from '@/utils/dataCache';

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

  // Ambil 5 pekerjaan terbaru yang belum selesai
  const activeJobs = data
    .filter(i => i.status !== 'FINISH')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const columns = [
    {
      header: 'Perusahaan (Kode)',
      accessor: (row: any) => (
        row.company ? (
          <div>
            <span style={{ backgroundColor: 'var(--blue-100)', color: 'var(--blue-800)', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 700, marginRight: '0.4rem' }}>
              {row.company.code}
            </span>
            <span style={{ fontWeight: 600 }}>{row.company.name}</span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Non-klien</span>
        )
      )
    },
    { header: 'PIC', accessor: (row: any) => row.pic?.name || '-' },
    { header: 'Kategori', accessor: (row: any) => <Badge variant="blue">{row.kategoriPerbaikan || row.kategori}</Badge> },
    { header: 'Status', accessor: (row: any) => <StatusBadge status={row.status} /> },
    { header: 'Tanggal Masuk', accessor: (row: any) => formatDate(row.createdAt) },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Ringkasan status pekerjaan dan inventori secara real-time.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} value={stat.value.toString()} />
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Pekerjaan Aktif Terbaru</h3>
        <DataTable columns={columns} data={activeJobs} keyExtractor={(r) => r.id} emptyMessage={fetching ? "Memuat data terbaru..." : "Tidak ada pekerjaan aktif"} />
      </div>
    </div>
  );
}
