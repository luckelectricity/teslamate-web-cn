import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  subtext?: string;
  trend?: {
    value: string;
    isGood?: boolean;
  };
  highlight?: boolean;
}

export function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  subtext,
  trend,
  highlight = false,
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-3.5 sm:p-4 transition-all duration-200 border ${
        highlight
          ? 'bg-zinc-900/90 border-red-500/30 shadow-lg shadow-red-950/20'
          : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/80'
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-medium text-zinc-400 whitespace-nowrap truncate">{title}</span>
        {Icon && (
          <div className="p-1.5 rounded-lg bg-zinc-800/80 text-zinc-400 shrink-0">
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-1 overflow-hidden">
        <span className="text-xl sm:text-2xl font-bold tracking-tight text-white whitespace-nowrap truncate">
          {value}
        </span>
        {unit && <span className="text-[11px] font-medium text-zinc-400 shrink-0">{unit}</span>}
      </div>

      {(subtext || trend) && (
        <div className="mt-1.5 flex items-center justify-between text-[11px] gap-1">
          {subtext && <span className="text-zinc-500 truncate">{subtext}</span>}
          {trend && (
            <span
              className={`font-medium shrink-0 ${
                trend.isGood ? 'text-emerald-400' : 'text-zinc-400'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
