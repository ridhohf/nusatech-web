'use client';

import { useState, useEffect, useMemo } from 'react';
import apiClient from '@/api/client';
import { Package, Search, Plus, Minus, Trash2 } from 'lucide-react';
import { dataCache } from '@/utils/dataCache';

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
      await apiClient.delete(`/inventory/${id}`);
      
      const updated = inventory.filter(item => item.id !== id);
      setInventory(updated);
      dataCache.set('/inventory', updated);
      dataCache.invalidate('/inventory');
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Gagal menghapus barang dari database');
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

  return (
    <div className="w-full max-w-full">
      <div className="page-header mb-5">
        <h1 className="page-title">Manajemen Inventori</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
        {/* FORM TAMBAH BARANG */}
        <div className="card p-5">
          <h3 className="text-base font-bold text-blue-900 mb-4 flex items-center gap-2">
            <Package size={18} className="text-blue-600 shrink-0" />
            <span>Tambah Barang Baru</span>
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="form-group mb-0">
              <label className="form-label text-xs">Kode Barang *</label>
              <input 
                type="text" 
                className="form-input text-xs" 
                required 
                value={formData.kodeBarang} 
                onChange={e => setFormData({...formData, kodeBarang: e.target.value})} 
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label text-xs">Jenis Barang *</label>
              <select 
                className="form-input text-xs" 
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

            <div className="form-group mb-0">
              <label className="form-label text-xs">Spesifikasi *</label>
              <input 
                type="text" 
                className="form-input text-xs" 
                required 
                value={formData.specBarang} 
                onChange={e => setFormData({...formData, specBarang: e.target.value})} 
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="form-group mb-0">
                <label className="form-label text-xs">Kuantitas *</label>
                <input 
                  type="number" 
                  min="0" 
                  className="form-input text-xs" 
                  required 
                  value={formData.quantity} 
                  onChange={e => setFormData({...formData, quantity: e.target.value === '' ? '' : parseInt(e.target.value)})} 
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label text-xs">Satuan *</label>
                <input 
                  type="text" 
                  className="form-input text-xs" 
                  required 
                  value={formData.unitOfIssue} 
                  onChange={e => setFormData({...formData, unitOfIssue: e.target.value})} 
                />
              </div>
            </div>

            <div className="form-group mb-0">
              <label className="form-label text-xs">Harga Satuan (Rp)</label>
              <input 
                type="number" 
                min="0" 
                className="form-input text-xs" 
                value={formData.harga} 
                onChange={e => setFormData({...formData, harga: e.target.value === '' ? '' : parseInt(e.target.value)})} 
              />
            </div>

            <button type="submit" className="btn btn-primary w-full text-xs font-bold py-2.5 mt-2 shadow-xs" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Tambah ke Inventori'}
            </button>
          </form>
        </div>

        {/* DAFTAR INVENTORI & FILTER */}
        <div className="card p-5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-blue-900 m-0">Daftar Inventori Gudang</h3>

            {/* PENCARIAN & FILTER KATEGORI */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-44 sm:w-52">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  style={{ height: '36px', padding: '0 0.75rem 0 2.1rem' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="bg-white text-slate-800 font-medium border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shrink-0 cursor-pointer"
                style={{
                  height: '36px',
                  width: '135px',
                  padding: '0 0.75rem',
                  lineHeight: '36px',
                }}
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

          {/* TABEL INVENTORI LENGKAP & HARGA */}
          <div className="table-container overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="data-table w-full text-xs">
              <thead>
                <tr>
                  <th className="whitespace-nowrap py-2.5 px-3">KODE</th>
                  <th className="whitespace-nowrap py-2.5 px-3">JENIS</th>
                  <th className="whitespace-nowrap py-2.5 px-3">SPESIFIKASI</th>
                  <th className="whitespace-nowrap py-2.5 px-3">STOK</th>
                  <th className="whitespace-nowrap py-2.5 px-3">HARGA SATUAN</th>
                  <th className="whitespace-nowrap py-2.5 px-3">TOTAL NILAI</th>
                  <th className="whitespace-nowrap py-2.5 px-3">STATUS</th>
                  <th className="whitespace-nowrap py-2.5 px-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item: any) => {
                  const qty = Number(item.quantity) || 0;
                  const harga = Number(item.harga) || 0;
                  const total = qty * harga;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="font-bold font-mono text-blue-900 whitespace-nowrap py-2.5 px-3">
                        {item.kodeBarang}
                      </td>
                      <td className="whitespace-nowrap py-2.5 px-3">
                        <span className="badge badge-blue text-[11px] font-semibold">{item.jenisBarang}</span>
                      </td>
                      <td className="font-medium text-slate-800 py-2.5 px-3">{item.specBarang}</td>
                      <td className="whitespace-nowrap py-2.5 px-3">
                        <span className={`font-extrabold ${qty <= 5 ? 'text-amber-600' : 'text-slate-900'}`}>
                          {qty} {item.unitOfIssue}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-2.5 px-3 text-slate-600">Rp {harga.toLocaleString('id-ID')}</td>
                      <td className="whitespace-nowrap py-2.5 px-3 font-semibold text-emerald-700">Rp {total.toLocaleString('id-ID')}</td>
                      <td className="whitespace-nowrap py-2.5 px-3">
                        {qty > 5 ? (
                          <span className="badge badge-green text-[10px] font-bold">AMAN</span>
                        ) : (
                          <span className="badge badge-orange text-[10px] font-bold">RESTOCK</span>
                        )}
                      </td>

                      {/* AKSI CEPAT (RESTOCK & HAPUS) - RAPI & SEJAJAR */}
                      <td className="whitespace-nowrap py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateStock(item.id, 5)}
                            title="Tambah 5 unit"
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            <Plus size={11} className="stroke-[2.5]" />
                            <span>5</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStock(item.id, -1)}
                            disabled={qty <= 0}
                            title="Kurangi 1 unit"
                            className="inline-flex items-center justify-center w-6 h-6 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            <Minus size={11} className="stroke-[2.5]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.kodeBarang)}
                            title="Hapus barang"
                            className="inline-flex items-center justify-center w-6 h-6 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
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
                    <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
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
