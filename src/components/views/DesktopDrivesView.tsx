'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { DriveSummary } from '@/types';
import { formatDistance, formatDuration, formatEnergy, formatEfficiency, formatDateTime } from '@/lib/formatters';
import { Route, MapPin, Zap, ChevronRight, Gauge, Mountain, Calendar } from 'lucide-react';
import { DriveFilterPeriod } from './MobileDrivesView';

interface DesktopDrivesViewProps {
  drives: DriveSummary[];
}

export function DesktopDrivesView({ drives }: DesktopDrivesViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<DriveFilterPeriod>('all');

  const filterOptions: { key: DriveFilterPeriod; label: string }[] = [
    { key: 'today', label: '今日行程' },
    { key: '3d', label: '近3日' },
    { key: '7d', label: '近7日' },
    { key: '30d', label: '近30日' },
    { key: 'all', label: '全部历史' },
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

  const totalDistance = filteredDrives.reduce((sum, d) => sum + (d.distance || 0), 0);
  const totalEnergy = filteredDrives.reduce((sum, d) => sum + (d.consumption_kwh || 0), 0);
  const totalDuration = filteredDrives.reduce((sum, d) => sum + (d.duration_min || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 顶部统计汇总与快速时间筛选 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-5 rounded-3xl border border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Route className="w-5 h-5 text-blue-500" />
              <span>历史行程与驾驶分析</span>
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {filteredDrives.length} 次行程
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            已开启智能行程合并算法，10分钟内临时锁车已自动合并为完整连贯行程
          </p>
        </div>

        {/* 筛选切换 Tabs 与 动态统计 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="inline-flex p-1 bg-zinc-950/80 rounded-2xl border border-zinc-800">
            {filterOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelectedPeriod(opt.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                  selectedPeriod === opt.key
                    ? 'bg-zinc-800 text-blue-400 font-bold shadow-sm border border-zinc-700/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <div className="bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-center">
              <div className="text-zinc-400 text-[10px]">行驶里程</div>
              <div className="text-xs font-bold text-white mt-0.5">{totalDistance.toFixed(1)} km</div>
            </div>
            <div className="bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-center">
              <div className="text-zinc-400 text-[10px]">动力耗电</div>
              <div className="text-xs font-bold text-emerald-400 mt-0.5">{totalEnergy.toFixed(1)} kWh</div>
            </div>
            <div className="bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-center">
              <div className="text-zinc-400 text-[10px]">驾驶时长</div>
              <div className="text-xs font-bold text-indigo-400 mt-0.5">{formatDuration(totalDuration)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 宽表记录 */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800/80">
                <th className="pb-3 font-semibold">开始时间</th>
                <th className="pb-3 font-semibold">路线 (起点 ➔ 终点)</th>
                <th className="pb-3 font-semibold">里程</th>
                <th className="pb-3 font-semibold">时长</th>
                <th className="pb-3 font-semibold">电量变化</th>
                <th className="pb-3 font-semibold">耗电量 / 综合能耗</th>
                <th className="pb-3 font-semibold">均速 / 极速</th>
                <th className="pb-3 font-semibold text-right">轨迹回放</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
              {filteredDrives.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <Calendar className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                    <div className="text-sm font-medium text-zinc-400">选定时间范围内暂无行驶记录</div>
                    <p className="text-xs text-zinc-600 mt-1">请切换为「全部历史」或选择其他时间段</p>
                  </td>
                </tr>
              ) : (
                filteredDrives.map((drive) => {
                  const batteryDiff = drive.start_battery_level - drive.end_battery_level;
                  return (
                    <tr key={drive.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 font-mono text-zinc-400 whitespace-nowrap">
                        <div>{formatDateTime(drive.start_date)}</div>
                        {drive.is_merged && (
                          <div className="mt-1">
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium">
                              ⚡ 合并{drive.merged_count}段
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 max-w-xs truncate">
                        <div className="truncate text-zinc-200">
                          <span className="text-emerald-400 font-bold mr-1">起</span>{drive.start_address}
                        </div>
                        <div className="truncate text-zinc-400 text-[11px] mt-0.5">
                          <span className="text-red-400 font-bold mr-1">终</span>{drive.end_address}
                        </div>
                      </td>
                      <td className="py-3.5 font-bold text-white whitespace-nowrap">
                        {formatDistance(drive.distance)}
                      </td>
                      <td className="py-3.5 text-zinc-300 whitespace-nowrap">
                        {formatDuration(drive.duration_min)}
                      </td>
                      <td className="py-3.5 font-semibold text-emerald-400 whitespace-nowrap">
                        {drive.start_battery_level}% → {drive.end_battery_level}% {batteryDiff > 0 ? `(-${batteryDiff}%)` : ''}
                      </td>
                      <td className="py-3.5 whitespace-nowrap">
                        <span className="font-bold text-white">{formatEnergy(drive.consumption_kwh)}</span>
                        <span className="text-zinc-400 text-[11px] ml-1.5">({formatEfficiency(drive.efficiency_wh_km)})</span>
                      </td>
                      <td className="py-3.5 text-zinc-300 whitespace-nowrap">
                        {drive.speed_avg} / {drive.speed_max} <span className="text-[10px] text-zinc-500">km/h</span>
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        <Link
                          href={`/drives/${drive.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-medium transition-colors text-xs border border-blue-500/20"
                        >
                          <span>查看轨迹</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
