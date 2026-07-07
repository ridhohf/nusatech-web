'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { Package } from 'lucide-react';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    jenisBarang: '', specBarang: '', kodeBarang: '', quantity: 1 as number | string, unitOfIssue: 'Pcs', harga: 0 as number | string
  });

  const fetchInventory = async () => {
    try {
      const res = await apiClient.get('/inventory');
      setInventory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/inventory', {
        ...formData,
        quantity: Number(formData.quantity),
        harga: Number(formData.harga)
      });
      setFormData({ jenisBarang: '', specBarang: '', kodeBarang: '', quantity: 1, unitOfIssue: 'Pcs', harga: 0 });
      fetchInventory();
    } catch (err) {
      alert('Gagal menambah inventori');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manajemen Inventori</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Kelola data material, sparepart, dan aksesori.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '2rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} color="var(--blue-600)" /> Tambah Barang
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Kode Barang</label>
              <input type="text" className="form-input" required value={formData.kodeBarang} onChange={e => setFormData({...formData, kodeBarang: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Jenis Barang</label>
              <select className="form-input" value={formData.jenisBarang} onChange={e => setFormData({...formData, jenisBarang: e.target.value})} required>
                <option value="">Pilih Jenis...</option>
                <option value="Raw Material">Raw Material</option>
                <option value="Sparepart">Sparepart</option>
                <option value="Consumable">Consumable</option>
                <option value="Aksesoris">Aksesoris</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Spesifikasi</label>
              <input type="text" className="form-input" required value={formData.specBarang} onChange={e => setFormData({...formData, specBarang: e.target.value})} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Kuantitas</label>
                <input type="number" min="0" className="form-input" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value === '' ? '' : parseInt(e.target.value)})} />
              </div>
              <div className="form-group">
                <label className="form-label">Satuan</label>
                <input type="text" className="form-input" required value={formData.unitOfIssue} onChange={e => setFormData({...formData, unitOfIssue: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Harga Estimasi (Rp)</label>
              <input type="number" min="0" className="form-input" required value={formData.harga} onChange={e => setFormData({...formData, harga: e.target.value === '' ? '' : parseInt(e.target.value)})} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Tambah ke Inventori'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Daftar Inventori</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Jenis</th>
                  <th>Spesifikasi</th>
                  <th>Stok</th>
                  <th>Satuan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item: any) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.kodeBarang}</td>
                    <td>{item.jenisBarang}</td>
                    <td>{item.specBarang}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unitOfIssue}</td>
                    <td>
                      {item.quantity > 5 ? (
                        <span className="badge badge-green">AMAN</span>
                      ) : (
                        <span className="badge badge-orange">RESTOCK</span>
                      )}
                    </td>
                  </tr>
                ))}
                {inventory.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data inventori</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
