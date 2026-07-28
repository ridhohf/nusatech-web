import React from 'react';

export default function GlobalLoading() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(8px)',
      gap: '1rem',
    }}>
      {/* Top progress bar */}
      <div className="top-loader-bar" />

      {/* Animated Spinner */}
      <div className="spinner-ring" />
      <p style={{
        fontSize: '0.9rem',
        fontWeight: 600,
        color: 'var(--blue-800)',
        letterSpacing: '0.02em',
      }}>
        Loading...
      </p>
    </div>
  );
}
