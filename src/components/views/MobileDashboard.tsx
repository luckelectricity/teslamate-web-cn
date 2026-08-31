'use client';

import React from 'react';
import Link from 'next/link';
import { Car, DriveSummary, ChargeSummary, LifetimeStats } from '@/types';
import { CarStatusHero } from '@/components/car/CarStatusHero';
import { StatCard } from '@/components/common/StatCard';
import { formatDistance, formatDuration, formatEnergy, formatEfficiency, formatCurrency, formatDateTime } from '@/lib/formatters';
import { Route, Zap, ChevronRight, TrendingUp, Gauge } from 'lucide-react';

interface MobileDashboardProps {
  car: Car;
  latestDrive?: DriveSummary;
  latestCharge?: ChargeSummary;
  stats: LifetimeStats;
}

export function MobileDashboard({ car, latestDrive, latestCharge, stats }: MobileDashboardProps) {
  return (
    <div className="space-y-3.5 pb-20 pt-1 px-2.5 max-w-lg mx-auto">
      {/* 车辆状态 Hero 卡片 */}
      <CarStatusHero car={car} />

      {/* 快捷指标双列 */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard
          title="平均行驶能耗"
          value={stats.avg_efficiency_wh_km}
          unit="Wh/km"
          icon={TrendingUp}
          trend={{ value: '能效优异', isGood: true }}
        />
        <StatCard
          title="充电累计花费"
          value={stats.total_charge_cost.toFixed(1)}
          unit="元"
          icon={Zap}
          subtext={`共 ${stats.total_charges} 次家充`}
        />
      </div>

      {/* 最近一次行程卡片 */}
      {latestDrive && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Route className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white">最近行程</span>
            </div>
            <Link
              href={`/drives/${latestDrive.id}`}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-0.5"
            >
              <span>查看轨迹</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-2.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">行驶里程 / 耗时</span>
              <span className="font-semibold text-white">
                {formatDistance(latestDrive.distance)} · {formatDuration(latestDrive.duration_min)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">消耗电量 / 能效</span>
              <span className="font-semibold text-emerald-400">
                {formatEnergy(latestDrive.consumption_kwh)} ({formatEfficiency(latestDrive.efficiency_wh_km)})
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-800/40 text-[11px] text-zinc-400 truncate">
              📍 {latestDrive.end_address}
            </div>
          </div>
        </div>
      )}

      {/* 最近一次充电卡片 */}
      {latestCharge && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white">最近充电 (家充)</span>
            </div>
            <Link
              href={`/charges`}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-0.5"
            >
              <span>充电明细</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-2.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">充入电量</span>
              <span className="font-semibold text-emerald-400">
                +{formatEnergy(latestCharge.charge_energy_added)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">电量与时长</span>
              <span className="font-semibold text-white">
                {latestCharge.start_battery_level}% → {latestCharge.end_battery_level}% ({formatDuration(latestCharge.duration_min)})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">分时谷电费用</span>
              <span className="font-semibold text-amber-400">
                {formatCurrency(latestCharge.cost)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 车辆生命周期总览简报 */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-3.5 text-xs text-zinc-400 space-y-2">
        <div className="font-semibold text-zinc-200">
          📊 真实生命周期概览 ({stats.total_distance_km.toFixed(1)} km)
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
          <div>累计行程: <strong className="text-white">{stats.total_drives} 次</strong></div>
          <div>驾驶时长: <strong className="text-white">{stats.total_drive_duration_hours} 小时</strong></div>
          <div>累计充入: <strong className="text-white">{stats.total_charge_energy_added} kWh</strong></div>
          <div>
            平均电费:{' '}
            <strong className="text-emerald-400">
              ¥{(stats.total_charge_cost / Math.max(1, stats.total_distance_km)).toFixed(3)} / km
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
