import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: { backgroundColor: 'var(--blue-600)', color: 'white' },
  ghost: { backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' },
  danger: { backgroundColor: '#fef2f2', color: '#b91c1c' },
};

export function Button({ variant = 'primary', loading, children, disabled, style, ...props }: ButtonProps) {
  return (
    <button
      className="btn"
      style={{ ...variantStyles[variant], ...style }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
