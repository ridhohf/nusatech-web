'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { dataCache } from '@/utils/dataCache';

const STATUS_OPTIONS = ['PENDING', 'INSPEKSI', 'WAITING_MATERIAL', 'EKSEKUSI', 'QC', 'FINISH'];
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'PENDING',
  INSPEKSI: 'INSPEKSI',
  WAITING_MATERIAL: 'WAITING MATERIAL',
  EKSEKUSI: 'EKSEKUSI',
  QC: 'QC',
  FINISH: 'FINISH',
};

export default function RepairManagementPage() {
  const [inspections, setInspections] = useState<any[]>(() => dataCache.get('/inspections') || []);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Local state for edits
  const [editState, setEditState] = useState<Record<string, { status: string; file: File | null; catatan: string }>>({});

  const fetchData = async () => {
    const cached = dataCache.get('/inspections');
    if (cached) {
      setInspections(cached);
      const initialCached: any = {};
      cached.forEach((ins: any) => {
        initialCached[ins.id] = { status: ins.status, file: null, catatan: ins.catatan || '' };
      });
      setEditState(initialCached);
    }

    try {
      const res = await apiClient.get('/inspections');
      const insData = res.data.data || res.data;
      setInspections(insData);
      dataCache.set('/inspections', insData);

      const initial: any = {};
      insData.forEach((ins: any) => {
        initial[ins.id] = { status: ins.status, file: null, catatan: ins.catatan || '' };
      });
      setEditState(initial);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleExportCSV = () => {
    const headers = ['ID Pekerjaan', 'Tanggal Masuk', 'Perusahaan (Kode)', 'Kategori', 'Status', 'PIC', 'Catatan', 'Jumlah Material'];
    const rows = inspections.map((ins: any) => [
      ins.id,
      new Date(ins.createdAt).toLocaleDateString('id-ID'),
      ins.company ? `"${ins.company.name} (${ins.company.code})"` : 'Non-klien',
      ins.kategoriPerbaikan,
      ins.status,
      ins.pic?.name || '-',
      `"${(ins.catatan || '').replace(/"/g, '""')}"`,
      ins.items?.length || 0
    ]);
    
    const csvContent = [headers.join(',')]
      .concat(rows.map(row => row.join(',')))
      .join('\n');
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `laporan_perbaikan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async (id: string) => {
    const state = editState[id];
    if (!state) return;
    
    setUpdatingId(id);
    try {
      const formData = new FormData();
      formData.append('status', state.status);
      if (state.catatan) formData.append('catatan', state.catatan);
      if (state.file) formData.append('fotoBukti', state.file);

      await apiClient.put(`/inspections/${id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      dataCache.invalidate('/inspections');
      await fetchData();
      alert('Status berhasil diperbarui!');
    } catch (err) {
      alert('Gagal memperbarui status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Manajemen Perbaikan</h1>
        </div>
        <Button onClick={handleExportCSV} variant="ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white' }}>
          <Download size={18} /> Download Laporan CSV
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {inspections.map((ins: any) => {
          const state = editState[ins.id] || { status: ins.status, file: null, catatan: '' };
          const needsPhoto = state.status === 'QC' || state.status === 'FINISH';
          const isChanged = state.status !== ins.status || state.catatan !== (ins.catatan || '') || state.file !== null;

          return (
            <div key={ins.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  {ins.company ? (
                    <span style={{ backgroundColor: 'var(--blue-100)', color: 'var(--blue-800)', padding: '0.2rem 0.5rem', borderRadius: '0.35rem', fontSize: '0.8rem', fontWeight: 700 }}>
                      [{ins.company.code}] {ins.company.name}
                    </span>
                  ) : (
                    <span style={{ fontWeight: 700, color: 'var(--blue-800)' }}>#{ins.id.slice(-6).toUpperCase()}</span>
                  )}
                  <StatusBadge status={ins.status} />
                  <Badge variant="blue">{ins.kategoriPerbaikan}</Badge>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  PIC: <strong>{ins.pic?.name}</strong> · Material: <strong>{ins.items?.length || 0} item</strong> · {new Date(ins.createdAt).toLocaleDateString('id-ID')}
                </div>
                
                {ins.fotoBukti && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>FOTO BUKTI SEBELUMNYA:</p>
                    <img src={ins.fotoBukti} alt="Bukti" style={{ height: '80px', borderRadius: '0.5rem', border: '1px solid var(--border-color)', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>UPDATE STATUS</label>
                  <select
                    className="form-input"
                    value={state.status}
                    onChange={(e) => setEditState({ ...editState, [ins.id]: { ...state, status: e.target.value } })}
                    disabled={updatingId === ins.id}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>CATATAN (Opsional)</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Tambahkan catatan..."
                    value={state.catatan}
                    onChange={(e) => setEditState({ ...editState, [ins.id]: { ...state, catatan: e.target.value } })}
                  />
                </div>

                {needsPhoto && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#b91c1c', marginBottom: '0.25rem' }}>UPLOAD BUKTI FOTO *</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setEditState({ ...editState, [ins.id]: { ...state, file: e.target.files?.[0] || null } })}
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>
                )}

                <Button 
                  onClick={() => handleSave(ins.id)} 
                  disabled={!isChanged || (needsPhoto && !state.file && !ins.fotoBukti) || updatingId === ins.id}
                  style={{ width: '100%' }}
                >
                  {updatingId === ins.id ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </div>
          );
        })}
        {inspections.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Belum ada data pekerjaan
          </div>
        )}
      </div>
    </div>
  );
}
