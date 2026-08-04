import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus-visible:ring-blue-500',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 shadow-2xs',
  outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 border border-slate-200',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm font-semibold rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base font-semibold rounded-xl gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-sans transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin text-current" />}
      {children}
    </button>
  );
}
