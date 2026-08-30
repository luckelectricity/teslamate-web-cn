'use client';

import React from 'react';
import Link from 'next/link';
import { DriveSummary } from '@/types';
import { formatDistance, formatDuration, formatEnergy, formatEfficiency, formatDateTime } from '@/lib/formatters';
import { Route, ChevronRight, Zap, TrendingUp, Navigation, ArrowUpRight, Gauge, Thermometer } from 'lucide-react';

interface MobileDrivesViewProps {
  drives: DriveSummary[];
}

export function MobileDrivesView({ drives }: MobileDrivesViewProps) {
  return (
    <div className="space-y-3 pb-24 pt-2 px-2.5 max-w-lg mx-auto">
      {/* 顶部统计摘要 */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Route className="w-5 h-5 text-blue-500" />
          <span>真实行程历史</span>
        </h2>
        <span className="text-xs text-zinc-400">共 {drives.length} 次记录</span>
      </div>

      {/* 行程时间轴列表 */}
      <div className="space-y-2.5">
        {drives.map((drive) => {
          const batteryDiff = drive.start_battery_level - drive.end_battery_level;
          return (
            <Link
              key={drive.id}
              href={`/drives/${drive.id}`}
              className="block bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-2xl p-3.5 shadow-md transition-all active:scale-[0.99]"
            >
              {/* 头部：时间与主要里程 */}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-400">
                    {formatDateTime(drive.start_date)}
                  </span>
                  {drive.is_merged && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium">
                      ⚡ 合并{drive.merged_count}段
                    </span>
                  )}
                </div>
                <span className="font-bold text-white text-sm">
                  {formatDistance(drive.distance)}
                </span>
              </div>

              {/* 中部：3 列严格防重叠排版 */}
              <div className="mt-2.5 grid grid-cols-3 gap-2 text-center bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/50 text-xs">
                {/* 1. 耗时与均速 */}
                <div className="flex flex-col justify-center min-w-0">
                  <div className="text-[10px] text-zinc-400 truncate">耗时 / 均速</div>
                  <div className="font-semibold text-zinc-200 mt-0.5 truncate whitespace-nowrap">
                    {formatDuration(drive.duration_min)}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 truncate whitespace-nowrap">
                    均速 {Math.round(drive.speed_avg)} km/h
                  </div>
                </div>

                {/* 2. 电量变化 */}
                <div className="flex flex-col justify-center min-w-0 border-x border-zinc-800/60 px-1">
                  <div className="text-[10px] text-zinc-400 truncate">电量消耗</div>
                  <div className="font-semibold text-emerald-400 mt-0.5 truncate whitespace-nowrap">
                    {drive.start_battery_level}% ➔ {drive.end_battery_level}%
                  </div>
                  <div className="text-[10px] text-emerald-500/80 mt-0.5 truncate whitespace-nowrap">
                    {batteryDiff > 0 ? `-${batteryDiff}%` : '0%'} ({formatEnergy(drive.consumption_kwh)})
                  </div>
                </div>

                {/* 3. 综合能耗 */}
                <div className="flex flex-col justify-center min-w-0">
                  <div className="text-[10px] text-zinc-400 truncate">百公里能耗</div>
                  <div className="font-semibold text-white mt-0.5 truncate whitespace-nowrap">
                    {drive.efficiency_wh_km} <span className="text-[10px] font-normal text-zinc-400">Wh/km</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 truncate whitespace-nowrap">
                    ~¥{(drive.efficiency_wh_km * 0.000311).toFixed(3)}/km
                  </div>
                </div>
              </div>

              {/* 底部：起点与终点 */}
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400">
                <div className="flex items-center gap-1 min-w-0 flex-1 truncate pr-2">
                  <span className="text-emerald-400 font-bold shrink-0">起:</span>
                  <span className="truncate">{drive.start_address}</span>
                </div>
                <div className="flex items-center gap-0.5 text-blue-400 shrink-0 font-medium text-[11px]">
                  <span>轨迹</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-zinc-400 truncate">
                <span className="text-red-400 font-bold shrink-0">终:</span>
                <span className="truncate">{drive.end_address}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
