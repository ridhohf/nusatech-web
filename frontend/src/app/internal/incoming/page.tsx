'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { ClipboardCheck, Plus, Building2, X, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { dataCache } from '@/utils/dataCache';

interface Company {
  id: string;
  code: string;
  name: string;
  contact?: string;
  phone?: string;
}

export default function IncomingPage() {
  const { user } = useAuthStore();
  const [inspections, setInspections] = useState<any[]>(() => dataCache.get('/inspections') || []);
  const [inventory, setInventory] = useState<any[]>(() => dataCache.get('/inventory') || []);
  const [companies, setCompanies] = useState<Company[]>(() => dataCache.get('/companies') || []);
  
  // Form State
  const [companyId, setCompanyId] = useState('');
  const [kategori, setKategori] = useState('REPAIR');
  const [catatan, setCatatan] = useState('');
  const [selectedItems, setSelectedItems] = useState<{inventoryId: string, quantityUsed: number}[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State for Quick Add Company
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyContact, setNewCompanyContact] = useState('');
  const [newCompanyPhone, setNewCompanyPhone] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);
  const [companySuccessMessage, setCompanySuccessMessage] = useState('');

  const fetchData = async () => {
    // 1. Render instantly from cache if available
    const cachedIns = dataCache.get('/inspections');
    const cachedInv = dataCache.get('/inventory');
    const cachedComp = dataCache.get('/companies');

    if (cachedIns) setInspections(cachedIns);
    if (cachedInv) setInventory(cachedInv);
    if (cachedComp) setCompanies(cachedComp);

    // 2. Fetch fresh data in background
    try {
      const [insRes, invRes, compRes] = await Promise.all([
        apiClient.get('/inspections'),
        apiClient.get('/inventory'),
        apiClient.get('/companies'),
      ]);

      const insData = insRes.data.data || insRes.data;
      const invData = invRes.data;
      const compData = compRes.data;

      setInspections(insData);
      setInventory(invData);
      setCompanies(compData);

      dataCache.set('/inspections', insData);
      dataCache.set('/inventory', invData);
      dataCache.set('/companies', compData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      alert('Silakan pilih Perusahaan Klien terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/inspections', {
        picId: user?.id,
        companyId,
        kategoriPerbaikan: kategori,
        catatan,
        items: selectedItems
      });
      setCatatan('');
      setCompanyId('');
      setSelectedItems([]);
      dataCache.invalidate('/inspections');
      dataCache.invalidate('/inventory');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan registrasi inspeksi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    setAddingCompany(true);
    try {
      const res = await apiClient.post('/companies', {
        name: newCompanyName.trim(),
        contact: newCompanyContact.trim() || undefined,
        phone: newCompanyPhone.trim() || undefined,
      });

      const createdCompany: Company = res.data;
      const updatedCompanies = [...companies, createdCompany];
      setCompanies(updatedCompanies);
      dataCache.set('/companies', updatedCompanies);
      setCompanyId(createdCompany.id);

      setCompanySuccessMessage(`Perusahaan ${createdCompany.name} berhasil ditambahkan! Kode Unik: [${createdCompany.code}]`);
      setTimeout(() => {
        setCompanySuccessMessage('');
        setShowCompanyModal(false);
        setNewCompanyName('');
        setNewCompanyContact('');
        setNewCompanyPhone('');
      }, 1200);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menambahkan perusahaan.');
    } finally {
      setAddingCompany(false);
    }
  };

  const addItem = (invId: string) => {
    if (!invId) return;
    if (selectedItems.some(item => item.inventoryId === invId)) return;
    setSelectedItems([...selectedItems, { inventoryId: invId, quantityUsed: 1 }]);
  };

  const removeItem = (invId: string) => {
    setSelectedItems(selectedItems.filter(item => item.inventoryId !== invId));
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Form Registrasi Baru & Inspeksi</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Registrasi penerimaan barang dari klien terdaftar dan catat hasil inspeksi awal.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.75fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* FORM REGISTRASI BARU */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--blue-900)' }}>
            <ClipboardCheck size={20} color="var(--blue-600)" /> Form Registrasi Baru
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Penanggung Jawab (PIC)</label>
              <input type="text" className="form-input" value={user?.name || ''} disabled style={{ backgroundColor: '#f1f5f9' }} />
            </div>

            {/* COMPANY SELECTION WITH + ADD COMPANY BUTTON */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Perusahaan Klien *</label>
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--blue-600)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <Plus size={14} /> Tambah Perusahaan Baru
                </button>
              </div>

              <select
                className="form-input"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                required
              >
                <option value="">-- Pilih Perusahaan Terdaftar --</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    [{comp.code}] {comp.name}
                  </option>
                ))}
              </select>

              {companies.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.35rem' }}>
                  * Belum ada perusahaan. Klik &quot;+ Tambah Perusahaan Baru&quot; di atas.
                </p>
              )}
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
                onChange={(e) => {
                  addItem(e.target.value);
                  e.target.value = '';
                }}
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
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 500, color: 'var(--blue-700)' }}>{invDetail?.kodeBarang} - {invDetail?.jenisBarang}</span>
                        <button type="button" onClick={() => removeItem(item.inventoryId)} style={{ color: '#b91c1c', border: 'none', background: 'none', cursor: 'pointer', padding: '0 0.25rem' }}>
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Registrasi'}
            </button>
          </form>
        </div>

        {/* DAFTAR REGISTRASI & INSPEKSI TERBARU */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', color: 'var(--blue-900)' }}>Daftar Registrasi Terbaru</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode Unik & Perusahaan</th>
                  <th>Kategori</th>
                  <th>Status</th>
                  <th>PIC</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((ins: any) => (
                  <tr key={ins.id}>
                    <td>
                      {ins.company ? (
                        <div>
                          <span style={{ display: 'inline-block', backgroundColor: 'var(--blue-100)', color: 'var(--blue-800)', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 700, marginRight: '0.5rem' }}>
                            {ins.company.code}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ins.company.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Umum / Non-klien</span>
                      )}
                    </td>
                    <td><span className="badge badge-blue">{ins.kategoriPerbaikan}</span></td>
                    <td><span className="badge badge-orange">{ins.status}</span></td>
                    <td>{ins.pic?.name}</td>
                    <td>{new Date(ins.createdAt).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
                {inspections.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data registrasi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: TAMBAH PERUSAHAAN BARU */}
      {showCompanyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '440px',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--blue-900)' }}>
                <Building2 size={20} color="var(--blue-600)" /> Tambah Perusahaan Baru
              </h3>
              <button
                onClick={() => setShowCompanyModal(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            {companySuccessMessage ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f0fdf4', color: '#15803d', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.9rem', border: '1px solid #86efac' }}>
                <CheckCircle size={20} />
                <div>{companySuccessMessage}</div>
              </div>
            ) : (
              <form onSubmit={handleCreateCompany}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Sistem akan secara otomatis memberikan **Kode Unik Berurutan** (contoh: 001, 002) untuk perusahaan ini.
                </p>

                <div className="form-group">
                  <label className="form-label">Nama Perusahaan *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Person (PIC Perusahaan)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCompanyContact}
                    onChange={(e) => setNewCompanyContact(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCompanyPhone}
                    onChange={(e) => setNewCompanyPhone(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowCompanyModal(false)}
                    style={{ backgroundColor: '#f1f5f9', color: 'var(--text-primary)' }}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={addingCompany}>
                    {addingCompany ? 'Menyimpan...' : 'Simpan & Gunakan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
