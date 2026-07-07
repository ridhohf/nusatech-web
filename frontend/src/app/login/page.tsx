'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { LogIn, Mail, Lock } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
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
      setAuth(user, token);
      
      if (user.role === 'INTERNAL') {
        router.push('/internal');
      } else {
        router.push('/client');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Pastikan server backend sedang menyala dan kredensial benar.');
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

      {/* Login Card */}
      <div className="auth-card" style={{ position: 'relative', zIndex: 10, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: 'var(--blue-600)', color: 'white', padding: '0.75rem', borderRadius: '0.75rem' }}>
              <LogIn size={28} />
            </div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--blue-800)' }}>PT Nusatech</h1>
          </div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Portal MRO & Inventori</h2>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid #f87171' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
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
                placeholder="admin@nusatech.co.id"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Password</label>
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
