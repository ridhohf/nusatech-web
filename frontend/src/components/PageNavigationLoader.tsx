'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PageNavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Trigger full-screen loading state when URL pathname or search params change
  useEffect(() => {
    // Keep full-screen loader visible for a brief moment after route change
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 450); // 450ms full-screen loading delay

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Intercept all internal link clicks to cover the screen IMMEDIATELY before navigation occurs
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.href && target.href.startsWith(window.location.origin)) {
        const targetUrl = new URL(target.href);
        if (targetUrl.pathname !== window.location.pathname) {
          setLoading(true); // Lock & cover screen immediately
        }
      }
    };

    window.addEventListener('click', handleAnchorClick);
    return () => window.removeEventListener('click', handleAnchorClick);
  }, []);

  if (!loading) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 99999,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.25rem',
      cursor: 'wait',
    }}>
      {/* Top Animated Progress Bar */}
      <div className="top-loader-bar" />

      {/* Large Centered Spinner */}
      <div className="spinner-ring" style={{ width: '48px', height: '48px', borderWidth: '4px' }} />

      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: 'var(--blue-900)',
          margin: 0,
          letterSpacing: '0.02em',
        }}>
          Nusatech Solusi Handal
        </p>
        <p style={{
          fontSize: '0.85rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          marginTop: '0.25rem',
        }}>
          Loading page...
        </p>
      </div>
    </div>
  );
}
