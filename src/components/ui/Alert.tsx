import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type AlertVariant = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message?: string;
  details?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'error',
  title,
  message,
  details,
  children,
  onClose,
  className = ''
}) => {
  const variantStyles: Record<AlertVariant, { container: string; text: string; title: string; icon: React.ReactNode }> = {
    error: {
      container: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
      title: 'text-rose-200',
      text: 'text-rose-300/90',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
    },
    success: {
      container: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
      title: 'text-emerald-200',
      text: 'text-emerald-300/90',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
    },
    warning: {
      container: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
      title: 'text-amber-200',
      text: 'text-amber-300/90',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
    },
    info: {
      container: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
      title: 'text-sky-200',
      text: 'text-sky-300/90',
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />
    }
  };

  const style = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs animate-scale-up ${style.container} ${className}`}
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="mt-0.5">{style.icon}</div>
        <div className="flex-1 space-y-0.5">
          {title && <p className={`font-bold text-sm ${style.title}`}>{title}</p>}
          {message && <p className={`leading-relaxed ${style.text}`}>{message}</p>}
          {details && <p className="text-[11px] opacity-80 mt-1 font-mono">{details}</p>}
          {children}
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/40 transition-colors"
          aria-label="Cerrar alerta"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
