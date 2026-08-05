'use client';

import { useState, useEffect, useMemo } from 'react';
import apiClient from '@/api/client';
import { Package, Search, Filter, Plus, Minus, Trash2, AlertTriangle, DollarSign, Boxes, TrendingUp } from 'lucide-react';
import { dataCache } from '@/utils/dataCache';
import { StatCard } from '@/components/ui/Card';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>(() => dataCache.get('/inventory') || []);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!dataCache.get('/inventory'));
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Form State
  const [formData, setFormData] = useState({
    jenisBarang: 'Sparepart',
    specBarang: '',
    kodeBarang: '',
    quantity: 1 as number | string,
    unitOfIssue: 'Pcs',
    harga: '' as number | string
  });

  const fetchInventory = async () => {
    const cached = dataCache.get('/inventory');
    if (cached) {
      setInventory(cached);
      setFetching(false);
    }

    try {
      const res = await apiClient.get('/inventory');
      const data = res.data.data || res.data;
      setInventory(data);
      dataCache.set('/inventory', data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeBarang.trim()) return;

    setLoading(true);
    try {
      await apiClient.post('/inventory', {
        ...formData,
        quantity: Number(formData.quantity) || 0,
        harga: Number(formData.harga) || 0
      });
      setFormData({ jenisBarang: 'Sparepart', specBarang: '', kodeBarang: '', quantity: 1, unitOfIssue: 'Pcs', harga: '' });
      dataCache.invalidate('/inventory');
      await fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menambah inventori');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (id: string, deltaQuantity: number) => {
    try {
      // Optimistic update
      const updated = inventory.map(item => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + deltaQuantity);
          return { ...item, quantity: newQty };
        }
        return item;
      });
      setInventory(updated);
      dataCache.set('/inventory', updated);

      await apiClient.patch(`/inventory/${id}/stock`, { deltaQuantity });
      dataCache.invalidate('/inventory');
    } catch (err) {
      console.error(err);
      fetchInventory();
    }
  };

  const handleDelete = async (id: string, kode: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus barang [${kode}] dari inventori?`)) return;
    try {
      const updated = inventory.filter(item => item.id !== id);
      setInventory(updated);
      dataCache.set('/inventory', updated);

      await apiClient.delete(`/inventory/${id}`);
      dataCache.invalidate('/inventory');
    } catch (err) {
      console.error(err);
      fetchInventory();
    }
  };

  // Filtered Inventory List
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = 
        (item.kodeBarang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.specBarang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.jenisBarang || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = filterCategory === 'ALL' || item.jenisBarang === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchQuery, filterCategory]);

  // Asset Metrics Calculation
  const totalItems = inventory.length;
  const totalValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.harga) || 0)), 0);
  }, [inventory]);
  
  const restockCount = useMemo(() => {
    return inventory.filter(item => Number(item.quantity) <= 5).length;
  }, [inventory]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manajemen Inventori</h1>
      </div>

      {/* 1. RINGKASAN NILAI ASET GUDANG (STAT CARDS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <StatCard
          title="Total Jenis Barang"
          value={totalItems}
          icon={<Boxes size={26} />}
          color="var(--blue-600)"
          bgColor="var(--blue-50)"
        />
        <StatCard
          title="Nilai Total Aset Gudang"
          value={`Rp ${totalValue.toLocaleString('id-ID')}`}
          icon={<TrendingUp size={26} />}
          color="#15803d"
          bgColor="#dcfce7"
        />
        <StatCard
          title="Perlu Restock (Stok ≤ 5)"
          value={restockCount}
          icon={<AlertTriangle size={26} />}
          color="#c2410c"
          bgColor="#ffedd5"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.3fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* FORM TAMBAH BARANG */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--blue-900)' }}>
            <Package size={20} color="var(--blue-600)" /> Tambah Barang Baru
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Kode Barang *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={formData.kodeBarang} 
                onChange={e => setFormData({...formData, kodeBarang: e.target.value})} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Jenis Barang *</label>
              <select 
                className="form-input" 
                value={formData.jenisBarang} 
                onChange={e => setFormData({...formData, jenisBarang: e.target.value})} 
                required
              >
                <option value="Sparepart">Sparepart</option>
                <option value="Raw Material">Raw Material</option>
                <option value="Consumable">Consumable</option>
                <option value="Aksesoris">Aksesoris</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Spesifikasi *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={formData.specBarang} 
                onChange={e => setFormData({...formData, specBarang: e.target.value})} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Kuantitas *</label>
                <input 
                  type="number" 
                  min="0" 
                  className="form-input" 
                  required 
                  value={formData.quantity} 
                  onChange={e => setFormData({...formData, quantity: e.target.value === '' ? '' : parseInt(e.target.value)})} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Satuan *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={formData.unitOfIssue} 
                  onChange={e => setFormData({...formData, unitOfIssue: e.target.value})} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Harga Satuan (Rp)</label>
              <input 
                type="number" 
                min="0" 
                className="form-input" 
                value={formData.harga} 
                onChange={e => setFormData({...formData, harga: e.target.value === '' ? '' : parseInt(e.target.value)})} 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Tambah ke Inventori'}
            </button>
          </form>
        </div>

        {/* DAFTAR INVENTORI & FILTER */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, color: 'var(--blue-900)' }}>Daftar Inventori Gudang</h3>

            {/* 2. PENCARIAN & FILTER KATEGORI */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: '180px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.25rem', height: '38px', fontSize: '0.8rem' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="form-input"
                style={{ width: 'auto', height: '38px', fontSize: '0.8rem' }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="ALL">Semua Jenis</option>
                <option value="Sparepart">Sparepart</option>
                <option value="Raw Material">Raw Material</option>
                <option value="Consumable">Consumable</option>
                <option value="Aksesoris">Aksesoris</option>
              </select>
            </div>
          </div>

          {/* 3. TABEL INVENTORI LENGKAP & HARGA */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Jenis</th>
                  <th>Spesifikasi</th>
                  <th>Stok</th>
                  <th>Harga Satuan</th>
                  <th>Total Nilai</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Aksi Cepat</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item: any) => {
                  const qty = Number(item.quantity) || 0;
                  const harga = Number(item.harga) || 0;
                  const total = qty * harga;

                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--blue-900)' }}>{item.kodeBarang}</td>
                      <td>
                        <span className="badge badge-blue">{item.jenisBarang}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{item.specBarang}</td>
                      <td>
                        <span style={{ fontWeight: 800, color: qty <= 5 ? '#c2410c' : '#0f172a' }}>
                          {qty} {item.unitOfIssue}
                        </span>
                      </td>
                      <td>Rp {harga.toLocaleString('id-ID')}</td>
                      <td style={{ fontWeight: 600, color: '#15803d' }}>Rp {total.toLocaleString('id-ID')}</td>
                      <td>
                        {qty > 5 ? (
                          <span className="badge badge-green">AMAN</span>
                        ) : (
                          <span className="badge badge-orange">RESTOCK</span>
                        )}
                      </td>

                      {/* 4. AKSI CEPAT (RESTOCK & HAPUS) */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => handleUpdateStock(item.id, 5)}
                            title="Tambah Stok +5"
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              border: '1px solid #86efac',
                              borderRadius: '0.35rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                            }}
                          >
                            <Plus size={12} /> Restock +5
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStock(item.id, -1)}
                            disabled={qty <= 0}
                            title="Kurangi Stok -1"
                            style={{
                              padding: '0.25rem 0.4rem',
                              fontSize: '0.75rem',
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                              borderRadius: '0.35rem',
                              cursor: qty <= 0 ? 'not-allowed' : 'pointer',
                              opacity: qty <= 0 ? 0.5 : 1,
                            }}
                          >
                            <Minus size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.kodeBarang)}
                            title="Hapus Barang"
                            style={{
                              padding: '0.25rem 0.4rem',
                              fontSize: '0.75rem',
                              backgroundColor: '#fef2f2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                              borderRadius: '0.35rem',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredInventory.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                      {fetching ? 'Memuat data inventori...' : 'Tidak ada data barang yang sesuai.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
