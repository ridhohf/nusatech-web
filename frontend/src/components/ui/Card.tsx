import React from 'react';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function Card({ children, style, className }: CardProps) {
  return (
    <div className={`card ${className ?? ''}`} style={style}>
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export function StatCard({ title, value, icon, color, bgColor }: StatCardProps) {
  return (
    <Card style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
      <div style={{ padding: '1rem', borderRadius: '1rem', backgroundColor: bgColor, color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--blue-900)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>{title}</div>
      </div>
    </Card>
  );
}
