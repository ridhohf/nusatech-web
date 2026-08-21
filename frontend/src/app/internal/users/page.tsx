'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { User as UserIcon, CheckCircle, Clock, Building2, ShieldCheck } from 'lucide-react';
import { dataCache } from '@/utils/dataCache';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>(() => dataCache.get('/users') || []);
  const [companies, setCompanies] = useState<any[]>(() => dataCache.get('/companies') || []);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!dataCache.get('/users'));
  
  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    password: '', 
    role: 'CLIENT',
    companyId: '',
  });

  const fetchUsersAndCompanies = async () => {
    const cachedUsers = dataCache.get('/users');
    if (cachedUsers) {
      setUsers(cachedUsers);
      setFetching(false);
    }
    const cachedCompanies = dataCache.get('/companies');
    if (cachedCompanies) {
      setCompanies(cachedCompanies);
    }

    try {
      const [resUsers, resCompanies] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/companies'),
      ]);

      const uData = resUsers.data.data || resUsers.data;
      const cData = resCompanies.data.data || resCompanies.data;

      setUsers(uData);
      setCompanies(cData);
      dataCache.set('/users', uData);
      dataCache.set('/companies', cData);
    } catch (err) {
      console.error('Error fetching users/companies:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUsersAndCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/users', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        companyId: formData.role === 'CLIENT' && formData.companyId ? formData.companyId : null,
      });
      setFormData({ name: '', email: '', password: '', role: 'CLIENT', companyId: '' });
      dataCache.invalidate('/users');
      await fetchUsersAndCompanies();
      alert('Akun user berhasil dibuat!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membuat akun user');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.patch(`/users/${id}/approve`);
      dataCache.invalidate('/users');
      await fetchUsersAndCompanies();
    } catch (err) {
      alert('Gagal menyetujui akun');
    }
  };

  const handleUpdateCompany = async (userId: string, companyId: string) => {
    try {
      await apiClient.patch(`/users/${userId}/company`, { companyId: companyId || null });
      dataCache.invalidate('/users');
      await fetchUsersAndCompanies();
    } catch (err) {
      alert('Gagal memperbarui perusahaan user');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manajemen Akun & Hak Akses Perusahaan</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '2rem' }}>
        {/* FORM BUAT AKUN BARU */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserIcon size={20} color="var(--blue-600)" /> Buat Akun Baru
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nama Lengkap / Kontak</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-input" 
                required 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                required 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Peran (Role)</label>
              <select 
                className="form-input" 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="CLIENT">Client (Pelanggan)</option>
                <option value="INTERNAL">Internal (Teknisi/Admin Nusatech)</option>
              </select>
            </div>

            {formData.role === 'CLIENT' && (
              <div className="form-group">
                <label className="form-label">Tautkan ke Perusahaan (Company)</label>
                <select 
                  className="form-input"
                  value={formData.companyId}
                  onChange={e => setFormData({...formData, companyId: e.target.value})}
                >
                  <option value="">-- Pilih Perusahaan --</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                  * Klien ini hanya dapat melihat proyek perusahaannya sendiri.
                </span>
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1rem' }} 
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Daftarkan Akun'}
            </button>
          </form>
        </div>

        {/* TABEL USERS */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Daftar Pengguna Aktif & Hak Akses Perusahaan</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Lengkap</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Perusahaan Klien Terhubung</th>
                  <th>Status Akun</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'INTERNAL' ? 'badge-blue' : 'badge-green'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.role === 'CLIENT' ? (
                        <select
                          value={u.companyId || ''}
                          onChange={(e) => handleUpdateCompany(u.id, e.target.value)}
                          className="form-input"
                          style={{
                            height: '32px',
                            lineHeight: '32px',
                            padding: '0 0.5rem',
                            fontSize: '0.75rem',
                            minWidth: '180px',
                            backgroundColor: u.companyId ? '#f0fdf4' : '#fffbeb',
                            borderColor: u.companyId ? '#86efac' : '#fde68a',
                            fontWeight: 600,
                          }}
                        >
                          <option value="">⚠️ Belum Ditautkan</option>
                          {companies.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              [{c.code}] {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                          <ShieldCheck size={12} /> Internal Nusatech
                        </span>
                      )}
                    </td>
                    <td>
                      {u.isApproved !== false ? (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={12} /> Aktif
                        </span>
                      ) : (
                        <span className="badge badge-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td>
                      {u.isApproved === false && (
                        <button 
                          onClick={() => handleApprove(u.id)}
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#16a34a' }}
                        >
                          Setujui
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !fetching && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data pengguna</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
