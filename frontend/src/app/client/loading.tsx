import React from 'react';

export default function ClientLoading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '1rem',
    }}>
      <div className="spinner-ring" />
      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--blue-800)' }}>
        Loading client portal...
      </p>
    </div>
  );
}
