'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { ClipboardCheck, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function IncomingPage() {
  const { user } = useAuthStore();
  const [inspections, setInspections] = useState([]);
  const [inventory, setInventory] = useState([]);
  
  // Form State
  const [kategori, setKategori] = useState('REPAIR');
  const [catatan, setCatatan] = useState('');
  const [selectedItems, setSelectedItems] = useState<{inventoryId: string, quantityUsed: number}[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [insRes, invRes] = await Promise.all([
        apiClient.get('/inspections'),
        apiClient.get('/inventory')
      ]);
      setInspections(insRes.data);
      setInventory(invRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/inspections', {
        picId: user?.id,
        kategoriPerbaikan: kategori,
        catatan,
        items: selectedItems
      });
      setCatatan('');
      setSelectedItems([]);
      fetchData(); // Refresh
    } catch (err) {
      alert('Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const addItem = (invId: string) => {
    if (!invId) return;
    setSelectedItems([...selectedItems, { inventoryId: invId, quantityUsed: 1 }]);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Barang Masuk & Inspeksi</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Catat penerimaan barang dari klien dan hasil inspeksi awal.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* FORM */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardCheck size={20} color="var(--blue-600)" /> Form Inspeksi Baru
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Penanggung Jawab (PIC)</label>
              <input type="text" className="form-input" value={user?.name || ''} disabled style={{ backgroundColor: '#f1f5f9' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Kategori Perbaikan</label>
              <select className="form-input" value={kategori} onChange={(e) => setKategori(e.target.value)}>
                <option value="REPAIR">Repair (Perbaikan)</option>
                <option value="GANTI">Ganti (Replace)</option>
                <option value="FABRIKASI">Fabrikasi</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Catatan Perbaikan</label>
              <textarea 
                className="form-input" 
                rows={3} 
                value={catatan} 
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Detail kerusakan atau permintaan klien..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Material yang Dibutuhkan</label>
              <select 
                className="form-input" 
                style={{ marginBottom: '0.5rem' }}
                onChange={(e) => addItem(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>+ Pilih Material dari Inventori</option>
                {inventory.map((inv: any) => (
                  <option key={inv.id} value={inv.id}>{inv.kodeBarang} - {inv.jenisBarang}</option>
                ))}
              </select>
              
              {selectedItems.length > 0 && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                  {selectedItems.map((item, idx) => {
                    const invDetail = inventory.find((i: any) => i.id === item.inventoryId) as any;
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 500, color: 'var(--blue-700)' }}>{invDetail?.kodeBarang}</span>
                        <span>Qty: {item.quantityUsed}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Inspeksi'}
            </button>
          </form>
        </div>

        {/* LIST */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Daftar Inspeksi Terbaru</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kategori</th>
                  <th>Status</th>
                  <th>PIC</th>
                  <th>Material</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((ins: any) => (
                  <tr key={ins.id}>
                    <td><span className="badge badge-blue">{ins.kategoriPerbaikan}</span></td>
                    <td><span className="badge badge-orange">{ins.status}</span></td>
                    <td>{ins.pic?.name}</td>
                    <td>{ins.items?.length || 0} item</td>
                    <td>{new Date(ins.createdAt).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
                {inspections.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data inspeksi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
