import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'blue' | 'green' | 'orange' | 'red';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200/60 ring-blue-500/20',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 ring-emerald-500/20',
  orange: 'bg-amber-50 text-amber-700 border-amber-200/60 ring-amber-500/20',
  red: 'bg-rose-50 text-rose-700 border-rose-200/60 ring-rose-500/20',
};

const dotStyles = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  orange: 'bg-amber-500',
  red: 'bg-rose-500',
};

export function Badge({ variant = 'blue', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors shadow-2xs',
        variantStyles[variant],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotStyles[variant])} />
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    PENDING:          { label: 'PENDING',          variant: 'orange' },
    INSPEKSI:         { label: 'INSPEKSI',          variant: 'blue' },
    WAITING_MATERIAL: { label: 'WAITING MATERIAL',  variant: 'red' },
    EKSEKUSI:         { label: 'EKSEKUSI',           variant: 'blue' },
    QC:               { label: 'QC',                 variant: 'blue' },
    FINISH:           { label: 'FINISH',             variant: 'green' },
  };
  const config = map[status] ?? { label: status, variant: 'blue' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
