import React from 'react';
import { Card } from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  colorScheme?: 'amber' | 'emerald' | 'sky' | 'purple' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorScheme = 'amber'
}) => {
  const colorMap = {
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      glow: 'from-amber-500/10 via-transparent to-transparent'
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      glow: 'from-emerald-500/10 via-transparent to-transparent'
    },
    sky: {
      iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      glow: 'from-sky-500/10 via-transparent to-transparent'
    },
    purple: {
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      glow: 'from-purple-500/10 via-transparent to-transparent'
    },
    rose: {
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      glow: 'from-rose-500/10 via-transparent to-transparent'
    }
  };

  const scheme = colorMap[colorScheme];

  return (
    <Card hoverEffect className="relative overflow-hidden group">
      {/* Background ambient glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${scheme.glow} rounded-bl-full pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-60`} />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">{title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-50 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>

        <div className={`p-3 rounded-2xl border ${scheme.iconBg} shadow-inner`}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center gap-1.5 text-xs">
          <span className={trend.isPositive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-slate-400">vs mes anterior</span>
        </div>
      )}
    </Card>
  );
};
