'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Package, ClipboardCheck, LogOut, Users, Wrench } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    { name: 'Form Registrasi Baru', path: '/internal/incoming', icon: ClipboardCheck },
    { name: 'Inventori', path: '/internal/inventory', icon: Package },
    { name: 'Manajemen Perbaikan', path: '/internal/repairs', icon: Wrench },
    { name: 'Manajemen Akun', path: '/internal/users', icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200/80 flex flex-col sticky top-0 h-screen shadow-2xs z-20">
        <div className="p-6 flex items-center gap-3 font-extrabold text-blue-900 border-b border-slate-200/80 text-xl tracking-tight">
          <span>Nusatech</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                href={item.path}
                key={item.path}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/80 mt-auto bg-slate-50/50">
          <div className="flex items-center gap-3 mb-3 p-1">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-sm text-slate-900 truncate">{user.name}</div>
              <div className="text-xs font-medium text-slate-500">Administrator</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-200/60"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-10 overflow-y-auto bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/40">
        {children}
      </main>
    </div>
  );
}
