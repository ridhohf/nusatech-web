'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { dataCache } from '@/utils/dataCache';

const STATUS_STEPS = ['PENDING', 'INSPEKSI', 'WAITING_MATERIAL', 'EKSEKUSI', 'QC', 'FINISH'];

const StatusStepper = ({ currentStatus }: { currentStatus: string }) => {
  const currentIndex = STATUS_STEPS.indexOf(currentStatus);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: '1rem', overflowX: 'auto' }}>
      {STATUS_STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: '70px' }}>
              <div style={{
                width: '2rem', height: '2rem', borderRadius: '50%',
                backgroundColor: isCurrent ? 'var(--blue-600)' : isDone ? 'var(--blue-300)' : 'var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isCurrent || isDone ? 'white' : 'var(--text-secondary)',
                fontWeight: 700, fontSize: '0.75rem',
                boxShadow: isCurrent ? '0 0 0 4px var(--blue-100)' : 'none',
                transition: 'all 0.3s ease',
              }}>
                {isDone ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: isCurrent ? 700 : 400, color: isCurrent ? 'var(--blue-700)' : 'var(--text-secondary)', textAlign: 'center' }}>
                {step}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div style={{
                height: '2px', flex: 1, marginBottom: '1.5rem',
                backgroundColor: isDone ? 'var(--blue-300)' : 'var(--border-color)',
                transition: 'background-color 0.3s ease',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function ClientPage() {
  const [inspections, setInspections] = useState<any[]>(() => dataCache.get('/client-inspections') || []);
  const { user } = useAuthStore();

  useEffect(() => {
    const cached = dataCache.get('/client-inspections');
    if (cached) setInspections(cached);

    apiClient.get('/inspections').then(res => {
      const insData = res.data.data || res.data;
      setInspections(insData);
      dataCache.set('/client-inspections', insData);
    }).catch(console.error);
  }, []);

  const stats = {
    total: inspections.length,
    selesai: inspections.filter((i: any) => i.status === 'FINISH').length,
    aktif: inspections.filter((i: any) => i.status !== 'FINISH').length,
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Monitoring Status Perbaikan</h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Pekerjaan', value: stats.total, color: 'var(--blue-600)', bg: 'var(--blue-50)' },
          { label: 'Sedang Berjalan', value: stats.aktif, color: '#c2410c', bg: '#ffedd5' },
          { label: 'Selesai', value: stats.selesai, color: '#15803d', bg: '#dcfce7' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Cards Per Pekerjaan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {inspections.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Belum ada data pekerjaan</p>
          </div>
        ) : (
          inspections.map((ins: any) => (
            <div key={ins.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', fontFamily: 'monospace', color: 'var(--blue-900)' }}>
                    {ins.projectCode || `${ins.company?.code || '6501'}-${ins.scopeCode || '10'}${ins.equipmentCode || '10'}`}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    PIC: {ins.pic?.name} · Masuk: {new Date(ins.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                  {ins.catatan && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--blue-50)', borderRadius: '0.5rem', fontSize: '0.875rem', color: 'var(--blue-800)' }}>
                      {ins.catatan}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-blue">{ins.kategoriPerbaikan}</span>
                  <span className={`badge ${ins.status === 'FINISH' ? 'badge-green' : ins.status === 'WAITING MATERIAL' ? 'badge-orange' : 'badge-blue'}`}>
                    {ins.status}
                  </span>
                </div>
              </div>

              <StatusStepper currentStatus={ins.status} />

              {ins.items && ins.items.length > 0 && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Material yang digunakan
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {ins.items.map((item: any) => (
                      <span key={item.id} style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--blue-50)', borderRadius: '0.5rem', fontSize: '0.8rem', color: 'var(--blue-700)', fontWeight: 500 }}>
                        {item.inventory?.kodeBarang} ×{item.quantityUsed}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ins.fotoBukti && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Bukti Perbaikan / QC
                  </div>
                  <a href={ins.fotoBukti} target="_blank" rel="noreferrer">
                    <img 
                      src={ins.fotoBukti} 
                      alt="Bukti Perbaikan" 
                      style={{ maxHeight: '150px', borderRadius: '0.5rem', border: '1px solid var(--border-color)', objectFit: 'cover', cursor: 'pointer' }} 
                    />
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
