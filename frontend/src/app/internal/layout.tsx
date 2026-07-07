'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Package, ClipboardCheck, LogOut, Users, Wrench } from 'lucide-react';
import Link from 'next/link';

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, token } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Wait for Zustand persist to hydrate before redirecting
    const timeout = setTimeout(() => {
      const currentToken = useAuthStore.getState().token;
      const currentUser = useAuthStore.getState().user;
      if (!currentToken || currentUser?.role !== 'INTERNAL') {
        router.push('/login');
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [router]);

  if (!mounted || !user) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/internal', icon: LayoutDashboard },
    { name: 'Barang Masuk', path: '/internal/incoming', icon: ClipboardCheck },
    { name: 'Inventori', path: '/internal/inventory', icon: Package },
    { name: 'Manajemen Perbaikan', path: '/internal/repairs', icon: Wrench },
    { name: 'Manajemen Akun', path: '/internal/users', icon: Users },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ backgroundColor: 'var(--blue-600)', color: 'white', padding: '0.5rem', borderRadius: '0.5rem' }}>
            <ClipboardCheck size={24} />
          </div>
          <span style={{ fontSize: '1.25rem' }}>Nusatech MRO</span>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1 }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 1rem' }}>
            Menu Utama
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link href={item.path} key={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: 'var(--blue-100)', color: 'var(--blue-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
              {user.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn" style={{ width: '100%', color: '#b91c1c', backgroundColor: '#fef2f2', justifyContent: 'flex-start' }}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
