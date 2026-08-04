'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { ClipboardCheck, Plus, Building2, X, CheckCircle, Tag } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { dataCache } from '@/utils/dataCache';

interface Company {
  id: string;
  code: string;
  regionCode?: string;
  name: string;
  contact?: string;
  phone?: string;
}

const SCOPE_OPTIONS = [
  { code: '10', name: 'Overhaul Total', kategoriEnum: 'REPAIR' },
  { code: '20', name: 'Overhaul Partial', kategoriEnum: 'REPAIR' },
  { code: '30', name: 'Pengadaan Spare Part', kategoriEnum: 'GANTI' },
  { code: '40', name: 'Tools', kategoriEnum: 'FABRIKASI' },
];

const EQUIPMENT_OPTIONS = [
  { code: '10', name: 'Pompa' },
  { code: '20', name: 'Motor Listrik' },
  { code: '30', name: 'Turbin' },
  { code: '40', name: 'Lain-lain' },
];

const REGION_OPTIONS = [
  { code: '65', name: 'Riau' },
  { code: '51', name: 'Sumbar' },
];

export default function IncomingPage() {
  const { user } = useAuthStore();
  const [inspections, setInspections] = useState<any[]>(() => dataCache.get('/inspections') || []);
  const [inventory, setInventory] = useState<any[]>(() => dataCache.get('/inventory') || []);
  const [companies, setCompanies] = useState<Company[]>(() => dataCache.get('/companies') || []);
  
  // Form State
  const [companyId, setCompanyId] = useState('');
  const [scopeCode, setScopeCode] = useState('10'); // AA
  const [equipmentCode, setEquipmentCode] = useState('10'); // BB
  const [catatan, setCatatan] = useState('');
  const [selectedItems, setSelectedItems] = useState<{inventoryId: string, quantityUsed: number}[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State for Quick Add Company
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [newCompanyRegion, setNewCompanyRegion] = useState('65'); // Default Riau 65
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyContact, setNewCompanyContact] = useState('');
  const [newCompanyPhone, setNewCompanyPhone] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);
  const [companySuccessMessage, setCompanySuccessMessage] = useState('');

  const fetchData = async () => {
    // 1. Render instantly from cache
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

  // Compute Live Preview of Project Code: [ID Perusahaan]-[AABB]
  const selectedCompany = companies.find(c => c.id === companyId);
  const computedProjectCode = selectedCompany ? `${selectedCompany.code}-${scopeCode}${equipmentCode}` : `-----${scopeCode}${equipmentCode}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      alert('Silakan pilih Perusahaan Klien terlebih dahulu.');
      return;
    }

    const matchedScope = SCOPE_OPTIONS.find(s => s.code === scopeCode);
    const kategoriEnum = matchedScope ? matchedScope.kategoriEnum : 'REPAIR';

    setLoading(true);
    try {
      await apiClient.post('/inspections', {
        picId: user?.id,
        companyId,
        scopeCode,
        equipmentCode,
        kategoriPerbaikan: kategoriEnum,
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
      alert(err.response?.data?.message || 'Gagal menyimpan registrasi pekerjaan');
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
        regionCode: newCompanyRegion,
        contact: newCompanyContact.trim() || undefined,
        phone: newCompanyPhone.trim() || undefined,
      });

      const createdCompany: Company = res.data;
      const updatedCompanies = [...companies, createdCompany];
      setCompanies(updatedCompanies);
      dataCache.set('/companies', updatedCompanies);
      setCompanyId(createdCompany.id);

      const regionName = newCompanyRegion === '65' ? 'Riau' : 'Sumbar';
      setCompanySuccessMessage(`Perusahaan ${createdCompany.name} (${regionName}) berhasil ditambahkan! ID Perusahaan: [${createdCompany.code}]`);
      setTimeout(() => {
        setCompanySuccessMessage('');
        setShowCompanyModal(false);
        setNewCompanyName('');
        setNewCompanyContact('');
        setNewCompanyPhone('');
      }, 1400);
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
          Registrasi penerimaan barang dari klien terdaftar.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.7fr', gap: '1.75rem', alignItems: 'start' }}>
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

            {/* COMPANY SELECTION */}
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
            </div>

            {/* SCOPE PEKERJAAN & JENIS PERALATAN */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Scope Pekerjaan</label>
                <select
                  className="form-input"
                  value={scopeCode}
                  onChange={(e) => setScopeCode(e.target.value)}
                >
                  {SCOPE_OPTIONS.map(s => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Jenis Peralatan</label>
                <select
                  className="form-input"
                  value={equipmentCode}
                  onChange={(e) => setEquipmentCode(e.target.value)}
                >
                  {EQUIPMENT_OPTIONS.map(eq => (
                    <option key={eq.code} value={eq.code}>
                      {eq.name}
                    </option>
                  ))}
                </select>
              </div>
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
              {loading ? 'Menyimpan...' : 'Simpan Registrasi Proyek'}
            </button>
          </form>
        </div>

        {/* DAFTAR REGISTRASI TERBARU */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', color: 'var(--blue-900)' }}>Daftar Registrasi Terbaru</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode Proyek</th>
                  <th>Perusahaan Klien</th>
                  <th>Scope & Peralatan</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((ins: any) => {
                  const scopeName = SCOPE_OPTIONS.find(s => s.code === ins.scopeCode)?.name || 'Perbaikan';
                  const equipName = EQUIPMENT_OPTIONS.find(eq => eq.code === ins.equipmentCode)?.name || 'Unit';

                  return (
                    <tr key={ins.id}>
                      <td>
                        <span style={{
                          fontFamily: 'monospace',
                          backgroundColor: 'var(--blue-100)',
                          color: 'var(--blue-900)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.35rem',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          letterSpacing: '0.02em',
                        }}>
                          {ins.projectCode || (ins.company ? `${ins.company.code}-1010` : `#${ins.id.slice(-6).toUpperCase()}`)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {ins.company ? ins.company.name : 'Non-klien'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <div><strong>{scopeName}</strong></div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{equipName}</div>
                      </td>
                      <td><span className="badge badge-orange">{ins.status}</span></td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(ins.createdAt).toLocaleDateString('id-ID')}</td>
                    </tr>
                  );
                })}
                {inspections.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data registrasi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: TAMBAH PERUSAHAAN BARU (RIAU / SUMBAR) */}
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
                {/* WILAYAH SELECTION */}
                <div className="form-group">
                  <label className="form-label">Wilayah Operasional *</label>
                  <select
                    className="form-input"
                    value={newCompanyRegion}
                    onChange={(e) => setNewCompanyRegion(e.target.value)}
                    required
                  >
                    {REGION_OPTIONS.map(reg => (
                      <option key={reg.code} value={reg.code}>
                        {reg.name}
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    * Kode Perusahaan akan terbuat otomatis (contoh: Riau = 6501, Sumbar = 5101).
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Perusahaan *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="misal: PT Restu / PT SPOS"
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
