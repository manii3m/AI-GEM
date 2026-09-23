import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, duration, onClose]);

  if (!toast) return null;

  const iconMap = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
    error: <XCircle className="h-5 w-5 text-rose-600 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-600 shrink-0" />,
  };

  const borderClasses = {
    success: 'border-emerald-200 bg-white',
    warning: 'border-amber-200 bg-white',
    error: 'border-rose-200 bg-white',
    info: 'border-blue-200 bg-white',
  }[toast.type];

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-200">
      <div
        className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg ${borderClasses}`}
        role="alert"
      >
        {iconMap[toast.type]}
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
          {toast.message && <p className="mt-0.5 text-xs text-slate-600">{toast.message}</p>}
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Dismiss toast"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
