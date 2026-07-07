import React from 'react';

interface BadgeProps {
  variant?: 'blue' | 'green' | 'orange' | 'red';
  children: React.ReactNode;
}

const variantMap = {
  blue: 'badge-blue',
  green: 'badge-green',
  orange: 'badge-orange',
  red: 'badge-red',
};

export function Badge({ variant = 'blue', children }: BadgeProps) {
  return <span className={`badge ${variantMap[variant]}`}>{children}</span>;
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
