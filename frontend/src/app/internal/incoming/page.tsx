'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { ClipboardCheck, Plus, Building2, X, CheckCircle, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { dataCache } from '@/utils/dataCache';

interface Company {
  id: string;
  code: string;
  regionCode?: string;
  name: string;
  address?: string;
  contact?: string;
  phone?: string;
  npwp?: string;
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

  // Modal State for Quick Add Company (Nama, Alamat, CP, No tel CP, NPWP, Region)
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyAddress, setNewCompanyAddress] = useState('');
  const [newCompanyContact, setNewCompanyContact] = useState('');
  const [newCompanyPhone, setNewCompanyPhone] = useState('');
  const [newCompanyNpwp, setNewCompanyNpwp] = useState('');
  const [newCompanyRegion, setNewCompanyRegion] = useState('AUTO');
  const [addingCompany, setAddingCompany] = useState(false);
  const [companySuccessMessage, setCompanySuccessMessage] = useState('');

  const getDetectedRegionInfo = () => {
    if (newCompanyRegion === '51') {
      return { code: '51', name: 'Sumatera Barat (Sumbar)', isAuto: false };
    }
    if (newCompanyRegion === '65') {
      return { code: '65', name: 'Riau', isAuto: false };
    }
    
    // AUTO detection from address or name
    const fullText = `${newCompanyName} ${newCompanyAddress}`.toLowerCase();
    const sumbarRegex = /sumbar|sumatera barat|padang|bukittinggi|payakumbuh|solok|sawahlunto|pariaman|padang panjang|pasaman|agam|dharmasraya|pesisir selatan|sijunjung|tanah datar|limapuluh kota|indarung/i;
    if (sumbarRegex.test(fullText)) {
      return { code: '51', name: 'Sumatera Barat (Sumbar)', isAuto: true };
    }
    return { code: '65', name: 'Riau (Default Base)', isAuto: true };
  };

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

  const handleDeleteProject = async (id: string, code: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus proyek [${code}]?`)) return;
    try {
      await apiClient.delete(`/inspections/${id}`);
      const updated = inspections.filter(ins => ins.id !== id);
      setInspections(updated);
      dataCache.set('/inspections', updated);
      dataCache.invalidate('/inspections');
    } catch (err: any) {
      console.error('Delete inspection error:', err);
      alert(err.response?.data?.message || 'Gagal menghapus proyek');
      fetchData();
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    setAddingCompany(true);
    try {
      const res = await apiClient.post('/companies', {
        name: newCompanyName.trim(),
        address: newCompanyAddress.trim() || undefined,
        contact: newCompanyContact.trim() || undefined,
        phone: newCompanyPhone.trim() || undefined,
        npwp: newCompanyNpwp.trim() || undefined,
        regionCode: newCompanyRegion !== 'AUTO' ? newCompanyRegion : undefined,
      });

      const createdCompany: Company = res.data;
      const updatedCompanies = [...companies, createdCompany];
      setCompanies(updatedCompanies);
      dataCache.set('/companies', updatedCompanies);
      setCompanyId(createdCompany.id);

      setCompanySuccessMessage(`Perusahaan ${createdCompany.name} berhasil ditambahkan! ID Perusahaan: [${createdCompany.code}] (Wilayah ${createdCompany.regionCode === '51' ? 'Sumatera Barat' : 'Riau'})`);
      setTimeout(() => {
        setCompanySuccessMessage('');
        setShowCompanyModal(false);
        setNewCompanyName('');
        setNewCompanyAddress('');
        setNewCompanyContact('');
        setNewCompanyPhone('');
        setNewCompanyNpwp('');
        setNewCompanyRegion('AUTO');
      }, 1500);
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
        <h1 className="page-title">Form Registrasi Baru</h1>
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
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((ins: any) => {
                  const scopeName = SCOPE_OPTIONS.find(s => s.code === ins.scopeCode)?.name || 'Perbaikan';
                  const equipName = EQUIPMENT_OPTIONS.find(eq => eq.code === ins.equipmentCode)?.name || 'Unit';
                  const currentProjectCode = ins.projectCode || `${ins.company?.code || '6501'}-${ins.scopeCode || '10'}${ins.equipmentCode || '10'}`;

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
                          {currentProjectCode}
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
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(ins.id, currentProjectCode)}
                          title="Hapus Proyek"
                          style={{
                            padding: '0.35rem 0.5rem',
                            backgroundColor: '#fef2f2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                            borderRadius: '0.4rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {inspections.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data registrasi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: TAMBAH PERUSAHAAN BARU (Nama, Alamat, CP, No tel CP, NPWP) */}
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
            maxWidth: '460px',
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
                {/* 1. NAMA PERUSAHAAN */}
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

                {/* 2. ALAMAT PERUSAHAAN */}
                <div className="form-group">
                  <label className="form-label">Alamat Perusahaan</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Jl. Indarung, Padang / Jl. Riau, Pekanbaru..."
                    value={newCompanyAddress}
                    onChange={(e) => setNewCompanyAddress(e.target.value)}
                  />
                </div>

                {/* 3. WILAYAH / PROVINSI OPERASIONAL */}
                {(() => {
                  const detected = getDetectedRegionInfo();
                  return (
                    <div className="form-group" style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>Wilayah / Provinsi *</label>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          color: detected.code === '51' ? '#047857' : '#1d4ed8',
                          backgroundColor: detected.code === '51' ? '#ecfdf5' : '#eff6ff',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '0.375rem',
                          border: `1px solid ${detected.code === '51' ? '#a7f3d0' : '#bfdbfe'}`
                        }}>
                          {detected.isAuto ? `⚡ Terdeteksi: [${detected.code}] ${detected.name}` : `🔒 Pilihan Manual: [${detected.code}] ${detected.name}`}
                        </span>
                      </div>
                      <select
                        className="form-input"
                        value={newCompanyRegion}
                        onChange={(e) => setNewCompanyRegion(e.target.value)}
                        style={{ height: '36px', lineHeight: '36px', padding: '0 0.75rem', fontWeight: 600 }}
                      >
                        <option value="AUTO">⚡ Deteksi Otomatis (Dari Kata Kunci Alamat)</option>
                        <option value="65">[65] Provinsi Riau (Pekanbaru, Dumai, Duri, Siak, dll.)</option>
                        <option value="51">[51] Provinsi Sumatera Barat (Padang, Bukittinggi, Payakumbuh, dll.)</option>
                      </select>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.3rem' }}>
                        * Kode Perusahaan akan diawali dengan kode wilayah (Riau: <b>65xx</b>, Sumbar: <b>51xx</b>).
                      </span>
                    </div>
                  );
                })()}

                {/* 4. CONTACT PERSON (CP) */}
                <div className="form-group">
                  <label className="form-label">Contact Person (CP)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCompanyContact}
                    onChange={(e) => setNewCompanyContact(e.target.value)}
                  />
                </div>

                {/* 5. NO TEL CP */}
                <div className="form-group">
                  <label className="form-label">No. Telepon CP</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCompanyPhone}
                    onChange={(e) => setNewCompanyPhone(e.target.value)}
                  />
                </div>

                {/* 6. NPWP */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">NPWP Perusahaan</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCompanyNpwp}
                    onChange={(e) => setNewCompanyNpwp(e.target.value)}
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
