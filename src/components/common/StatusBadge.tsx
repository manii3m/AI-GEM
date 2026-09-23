import React from 'react';

export type BadgeVariant =
  | 'active'
  | 'closing-soon'
  | 'under-evaluation'
  | 'closed'
  | 'eligible'
  | 'ineligible'
  | 'conditional'
  | 'pending'
  | 'in-verification'
  | 'verified'
  | 'review-required'
  | 'low-risk'
  | 'medium-risk'
  | 'high-risk'
  | 'critical-risk'
  | 'critical'
  | 'compliant'
  | 'non-compliant'
  | 'exempt'
  | 'qualified'
  | 'disqualified'
  | 'clarification-requested'
  | 'draft'
  | 'submitted'
  | 'not-applicable'
  | 'default';

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  size = 'md',
  className = '',
}) => {
  // Infer variant if not explicitly provided
  const normalized = (variant || status || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-500';

  switch (normalized) {
    case 'active':
    case 'eligible':
    case 'verified':
    case 'compliant':
    case 'low-risk':
    case 'low':
    case 'qualified':
    case 'success':
      styleClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200/90';
      dotColor = 'bg-emerald-600';
      break;

    case 'in-verification':
    case 'in-progress':
    case 'submitted':
    case 'info':
      styleClasses = 'bg-blue-50 text-blue-800 border-blue-200/90';
      dotColor = 'bg-blue-600';
      break;

    case 'pending':
    case 'conditional':
    case 'review-required':
    case 'closing-soon':
    case 'medium-risk':
    case 'medium':
    case 'warning':
    case 'clarification-requested':
    case 'clarification':
      styleClasses = 'bg-amber-50 text-amber-800 border-amber-200/90';
      dotColor = 'bg-amber-500';
      break;

    case 'ineligible':
    case 'non-compliant':
    case 'high-risk':
    case 'high':
    case 'failed':
    case 'disqualified':
    case 'danger':
      styleClasses = 'bg-rose-50 text-rose-800 border-rose-200/90';
      dotColor = 'bg-rose-600';
      break;

    case 'critical':
    case 'critical-risk':
      styleClasses = 'bg-rose-100 text-rose-900 border-rose-300 font-semibold';
      dotColor = 'bg-rose-700';
      break;

    case 'closed':
    case 'under-evaluation':
    case 'exempt':
    case 'draft':
    case 'not-applicable':
    case 'na':
      styleClasses = 'bg-slate-100 text-slate-700 border-slate-300/80';
      dotColor = 'bg-slate-400';
      break;

    default:
      styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
      dotColor = 'bg-slate-500';
      break;
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] font-medium'
      : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border ${sizeClasses} ${styleClasses} transition-colors ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} aria-hidden="true" />
      <span className="truncate">{status}</span>
    </span>
  );
};
