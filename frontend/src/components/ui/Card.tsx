import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: CardProps) {
  return (
    <div className={cn('flex flex-col gap-1.5 mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: CardProps) {
  return (
    <h3 className={cn('text-lg font-bold text-slate-900 tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  className?: string;
}

export function StatCard({ title, value, icon, color, bgColor, className }: StatCardProps) {
  return (
    <Card className={cn('flex items-center gap-4 p-5 hover:-translate-y-0.5', className)}>
      <div
        className="p-3.5 rounded-xl flex items-center justify-center transition-transform hover:scale-105"
        style={{ backgroundColor: bgColor, color }}
      >
        {icon}
      </div>
      <div>
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">{value}</div>
        <div className="text-xs font-semibold text-slate-500 mt-1.5">{title}</div>
      </div>
    </Card>
  );
}
