'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { DriveSummary } from '@/types';
import { formatDistance, formatDuration, formatEnergy, formatEfficiency, formatDateTime } from '@/lib/formatters';
import { Route, ChevronRight, Zap, TrendingUp, Navigation, ArrowUpRight, Gauge, Thermometer, Calendar, Filter } from 'lucide-react';

export type DriveFilterPeriod = 'today' | '3d' | '7d' | '30d' | 'all';

interface MobileDrivesViewProps {
  drives: DriveSummary[];
}

export function MobileDrivesView({ drives }: MobileDrivesViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<DriveFilterPeriod>('all');

  const filterOptions: { key: DriveFilterPeriod; label: string }[] = [
    { key: 'today', label: '今日' },
    { key: '3d', label: '近3日' },
    { key: '7d', label: '近7日' },
    { key: '30d', label: '近30日' },
    { key: 'all', label: '全部' },
  ];

  const filteredDrives = useMemo(() => {
    if (selectedPeriod === 'all') return drives;

    const now = new Date();
    if (selectedPeriod === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return drives.filter((d) => new Date(d.start_date).getTime() >= todayStart);
    }

    const daysMap: Record<string, number> = { '3d': 3, '7d': 7, '30d': 30 };
    const days = daysMap[selectedPeriod] || 30;
    const threshold = now.getTime() - days * 24 * 60 * 60 * 1000;

    return drives.filter((d) => new Date(d.start_date).getTime() >= threshold);
  }, [drives, selectedPeriod]);

  const totalDist = filteredDrives.reduce((s, d) => s + (d.distance || 0), 0);
  const totalKwh = filteredDrives.reduce((s, d) => s + (d.consumption_kwh || 0), 0);
  const totalMin = filteredDrives.reduce((s, d) => s + (d.duration_min || 0), 0);

  return (
    <div className="space-y-3 pb-24 pt-2 px-2.5 max-w-lg mx-auto">
      {/* 顶部标题与快速时间筛选器 */}
      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-3.5 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Route className="w-4 h-4 text-blue-500" />
            <span>行程记录与驾驶历史</span>
          </h2>
          <span className="text-xs font-semibold text-blue-400">
            {filteredDrives.length} 次行程
          </span>
        </div>

        {/* 筛选 Tabs */}
        <div className="flex items-center justify-between p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelectedPeriod(opt.key)}
              className={`flex-1 py-1.5 font-medium rounded-lg transition-all text-center ${
                selectedPeriod === opt.key
                  ? 'bg-zinc-800 text-blue-400 font-bold shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 动态统计汇总 */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
          <div className="bg-zinc-950/50 p-2 rounded-xl border border-zinc-800/50">
            <div className="text-[10px] text-zinc-400">行驶里程</div>
            <div className="text-sm font-bold text-white mt-0.5">{totalDist.toFixed(1)} km</div>
          </div>
          <div className="bg-zinc-950/50 p-2 rounded-xl border border-zinc-800/50">
            <div className="text-[10px] text-zinc-400">动力耗电</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">{totalKwh.toFixed(1)} kWh</div>
          </div>
          <div className="bg-zinc-950/50 p-2 rounded-xl border border-zinc-800/50">
            <div className="text-[10px] text-zinc-400">驾驶时长</div>
            <div className="text-sm font-bold text-indigo-400 mt-0.5">{formatDuration(totalMin)}</div>
          </div>
        </div>
      </div>

      {/* 空状态提示 */}
      {filteredDrives.length === 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400 space-y-2">
          <Calendar className="w-8 h-8 mx-auto text-zinc-600" />
          <div className="text-sm font-medium text-zinc-300">选定时间范围内暂无行程</div>
          <p className="text-xs text-zinc-500">
            切换为「全部」或选择其他时间段查看历史行驶记录
          </p>
        </div>
      )}

      {/* 行程时间轴列表 */}
      <div className="space-y-2.5">
        {filteredDrives.map((drive) => {
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
