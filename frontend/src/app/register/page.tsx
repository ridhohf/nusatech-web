'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/api/client';
import { Mail, Lock, User, Shield, UserPlus, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'INTERNAL'>('CLIENT');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

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

      if (role === 'CLIENT') {
        setSuccess('Account created successfully! Redirecting to sign in...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        setSuccess('Admin registration submitted. Pending Super Admin approval.');
        setName('');
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Register Card */}
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--blue-800)', fontWeight: 700 }}>Nusatech Solusi Handal</h1>
          <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.25rem' }}>
            Create an account
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

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">{role === 'CLIENT' ? 'Company Name' : 'Full Name'}</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="form-input" 
                style={{ paddingLeft: '2.5rem' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

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
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Account Type</label>
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
                <UserPlus size={16} /> Client
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
                <Shield size={16} /> Admin
              </button>
            </div>
            {role === 'INTERNAL' && (
              <p style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.5rem', fontStyle: 'italic' }}>
                * Admin accounts require approval before signing in.
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', fontWeight: 600 }} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link 
              href="/login"
              style={{ color: 'var(--blue-600)', fontWeight: 600, textDecoration: 'underline' }}
            >
              Sign in
            </Link>
          </div>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
