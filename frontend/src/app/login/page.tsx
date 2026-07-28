'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { Mail, Lock, User, Shield, UserPlus, KeyRound, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function ClientLoginPage() {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'INTERNAL'>('CLIENT');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user, token } = response.data;

      if (user.role === 'INTERNAL') {
        setError('Akun Anda adalah akun Admin. Silakan gunakan tombol "Login as Admin" di bawah.');
        return;
      }

      setAuth(user, token);
      router.push('/client');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal. Pastikan email dan password benar.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/register', {
        name,
        email,
        password,
        role,
      });

      setSuccess(response.data.message || 'Pendaftaran berhasil!');
      if (role === 'CLIENT') {
        // Auto switch to login with email prefilled
        setTimeout(() => {
          setMode('LOGIN');
          setSuccess('Akun Klien berhasil dibuat. Silakan login.');
        }, 1500);
      } else {
        setName('');
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/forgot-password', {
        email,
        newPassword,
      });
      setSuccess(response.data.message || 'Password berhasil diperbarui!');
      setTimeout(() => {
        setMode('LOGIN');
        setNewPassword('');
        setSuccess('Password berhasil diperbarui. Silakan login dengan password baru.');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mereset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background Image */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <Image 
          src="/auth-bg.png" 
          alt="Background" 
          fill 
          style={{ objectFit: 'cover', opacity: 0.8 }} 
          priority 
        />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.7) 0%, rgba(59, 130, 246, 0.4) 100%)' }} />
      </div>

      {/* Auth Card */}
      <div className="auth-card" style={{ position: 'relative', zIndex: 10, background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(16px)', width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--blue-800)', fontWeight: 700 }}>Nusatech Solusi Handal</h1>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.25rem' }}>
            {mode === 'LOGIN' && 'Portal Klien & Layanan MRO'}
            {mode === 'REGISTER' && 'Pendaftaran Akun Baru'}
            {mode === 'FORGOT' && 'Riset / Lupa Password'}
          </h2>
        </div>

        {/* Alert Messages */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fef2f2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.875rem', border: '1px solid #f87171' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f0fdf4', color: '#15803d', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.875rem', border: '1px solid #86efac' }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <div>{success}</div>
          </div>
        )}

        {/* MODE LOGIN KLIEN */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Klien / Perusahaan</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="klien@perusahaan.com"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <button 
                  type="button" 
                  onClick={() => { setError(''); setSuccess(''); setMode('FORGOT'); }}
                  style={{ background: 'none', border: 'none', color: 'var(--blue-600)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Lupa Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', fontWeight: 600, marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Memproses...' : 'Sign In (Login Klien)'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Belum memiliki akun Klien?{' '}
              <button 
                type="button" 
                onClick={() => { setError(''); setSuccess(''); setMode('REGISTER'); }}
                style={{ background: 'none', border: 'none', color: 'var(--blue-600)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign Up (Daftar Akun)
              </button>
            </div>
          </form>
        )}

        {/* MODE SIGN UP / REGISTRASI */}
        {mode === 'REGISTER' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Nama Lengkap / Nama Perusahaan</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="PT Maju Bersama / Nama Pengguna"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@perusahaan.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Daftar Sebagai (Role)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRole('CLIENT')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: role === 'CLIENT' ? '2px solid var(--blue-600)' : '1px solid var(--border-color)',
                    backgroundColor: role === 'CLIENT' ? 'var(--blue-50)' : 'white',
                    color: role === 'CLIENT' ? 'var(--blue-800)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <UserPlus size={16} /> Klien (Langsung Aktif)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('INTERNAL')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: role === 'INTERNAL' ? '2px solid var(--blue-600)' : '1px solid var(--border-color)',
                    backgroundColor: role === 'INTERNAL' ? 'var(--blue-50)' : 'white',
                    color: role === 'INTERNAL' ? 'var(--blue-800)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Shield size={16} /> Admin (Persetujuan)
                </button>
              </div>
              {role === 'INTERNAL' && (
                <p style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  * Pendaftaran akun Admin memerlukan verifikasi & approval dari Admin utama sebelum dapat login.
                </p>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', fontWeight: 600 }} disabled={loading}>
              {loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Sudah memiliki akun?{' '}
              <button 
                type="button" 
                onClick={() => { setError(''); setSuccess(''); setMode('LOGIN'); }}
                style={{ background: 'none', border: 'none', color: 'var(--blue-600)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Login Kembali
              </button>
            </div>
          </form>
        )}

        {/* MODE FORGOT PASSWORD */}
        {mode === 'FORGOT' && (
          <form onSubmit={handleForgotPassword}>
            <div className="form-group">
              <label className="form-label">Email Terdaftar</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@perusahaan.com"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Password Baru</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru Anda"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', fontWeight: 600 }} disabled={loading}>
              {loading ? 'Memperbarui...' : 'Simpan Password Baru'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem' }}>
              <button 
                type="button" 
                onClick={() => { setError(''); setSuccess(''); setMode('LOGIN'); }}
                style={{ background: 'none', border: 'none', color: 'var(--blue-600)', fontWeight: 600, cursor: 'pointer' }}
              >
                ← Batal & Kembali ke Login
              </button>
            </div>
          </form>
        )}

        {/* Footer Link: Login as Admin */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <Link href="/login/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--blue-700)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
            <Shield size={16} /> Login as Admin / Internal Staff <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
