import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badgeText?: string;
  badgeVariant?: 'neutral' | 'success' | 'warning' | 'info' | 'danger';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = 'neutral',
  onClick,
  className = '',
}) => {
  const badgeStyles = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
  }[badgeVariant];

  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-lg border border-slate-200/90 p-4 sm:p-5 shadow-xs transition-all duration-150 ${
        onClick
          ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm'
          : ''
      } ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50/80 text-slate-700 transition-colors group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(subtitle || badgeText) && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
          {subtitle && <span className="truncate text-slate-500 text-[11px]">{subtitle}</span>}
          {badgeText && (
            <span
              className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded border ${badgeStyles}`}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
