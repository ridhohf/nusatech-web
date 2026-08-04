'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { User as UserIcon, CheckCircle, Clock } from 'lucide-react';
import { dataCache } from '@/utils/dataCache';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>(() => dataCache.get('/users') || []);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!dataCache.get('/users'));
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'CLIENT'
  });

  const fetchUsers = async () => {
    const cached = dataCache.get('/users');
    if (cached) {
      setUsers(cached);
      setFetching(false);
    }

    try {
      const res = await apiClient.get('/users');
      setUsers(res.data);
      dataCache.set('/users', res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/users', formData);
      setFormData({ name: '', email: '', password: '', role: 'CLIENT' });
      dataCache.invalidate('/users');
      await fetchUsers();
    } catch (err) {
      alert('Gagal membuat akun user');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.patch(`/users/${id}/approve`);
      dataCache.invalidate('/users');
      await fetchUsers();
    } catch (err) {
      alert('Gagal menyetujui akun');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manajemen Akun</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '2rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserIcon size={20} color="var(--blue-600)" /> Buat Akun Baru
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nama Lengkap / Perusahaan</label>
              <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Budi Santoso" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="budi@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Peran (Role)</label>
              <select className="form-input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="CLIENT">Client (Pelanggan)</option>
                <option value="INTERNAL">Internal (Teknisi/Admin)</option>
              </select>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Memproses...' : 'Daftarkan Akun'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Daftar Pengguna Aktif & Permohonan Akun</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Lengkap</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status Akun</th>
                  <th>Tanggal Bergabung</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'INTERNAL' ? 'badge-blue' : 'badge-green'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.isApproved !== false ? (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={12} /> Aktif / Disetujui
                        </span>
                      ) : (
                        <span className="badge badge-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} /> Pending Approval
                        </span>
                      )}
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString('id-ID')}</td>
                    <td>
                      {u.isApproved === false && (
                        <button 
                          onClick={() => handleApprove(u.id)}
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#16a34a' }}
                        >
                          Setujui (Approve)
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
