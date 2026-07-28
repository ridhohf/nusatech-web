'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { Mail, Lock, Shield, ArrowRight, AlertCircle } from 'lucide-react';

export default function ClientLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user, token } = response.data;

      if (user.role === 'INTERNAL') {
        setError('This account is registered as an Admin. Please use Admin Sign In.');
        return;
      }

      setAuth(user, token);
      router.push('/client');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Auth Card */}
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--blue-800)', fontWeight: 700 }}>Nusatech Solusi Handal</h1>
          <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.25rem' }}>
            Welcome back
          </h2>
        </div>

        {/* Alert Messages */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fef2f2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.875rem', border: '1px solid #f87171' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="email" 
                className="form-input" 
                style={{ paddingLeft: '2.5rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <Link 
                href="/forgot-password"
                style={{ color: 'var(--blue-600)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}
              >
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                className="form-input" 
                style={{ paddingLeft: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', fontWeight: 600, marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <Link 
              href="/register"
              style={{ color: 'var(--blue-600)', fontWeight: 600, textDecoration: 'underline' }}
            >
              Sign up
            </Link>
          </div>
        </form>

        {/* Footer Link: Admin Login */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <Link href="/login/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--blue-700)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
            <Shield size={16} /> Admin Sign In <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
