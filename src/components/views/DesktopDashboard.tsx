'use client';

import React from 'react';
import Link from 'next/link';
import { Car, DriveSummary, ChargeSummary, LifetimeStats } from '@/types';
import { CarStatusHero } from '@/components/car/CarStatusHero';
import { StatCard } from '@/components/common/StatCard';
import { formatDistance, formatDuration, formatEnergy, formatEfficiency, formatCurrency, formatDateTime } from '@/lib/formatters';
import { Route, Zap, TrendingUp, Clock, ShieldCheck, ChevronRight, Gauge, Activity } from 'lucide-react';

interface DesktopDashboardProps {
  car: Car;
  drives: DriveSummary[];
  charges: ChargeSummary[];
  stats: LifetimeStats;
}

export function DesktopDashboard({ car, drives, charges, stats }: DesktopDashboardProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 顶部车辆核心全景卡片 */}
      <CarStatusHero car={car} />

      {/* 四大核心汇总指标 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="累计行驶里程"
          value={stats.total_distance_km.toLocaleString('zh-CN')}
          unit="km"
          icon={Gauge}
          subtext={`累计已行驶 ${stats.total_drives} 次行程`}
          highlight
        />
        <StatCard
          title="平均行驶能耗"
          value={stats.avg_efficiency_wh_km}
          unit="Wh/km"
          icon={TrendingUp}
          trend={{ value: '能效极佳', isGood: true }}
          subtext={`累计消耗 ${stats.total_energy_kwh} kWh`}
        />
        <StatCard
          title="充电累计充入"
          value={stats.total_charge_energy_added.toLocaleString('zh-CN')}
          unit="kWh"
          icon={Zap}
          subtext={`充电 ${stats.total_charges} 次`}
        />
        <StatCard
          title="累计充电总花费"
          value={stats.total_charge_cost.toLocaleString('zh-CN', { minimumFractionDigits: 1 })}
          unit="元"
          icon={Activity}
          trend={{ value: '平均每公里不到0.1元', isGood: true }}
          subtext="包含家充与超充"
        />
      </div>

      {/* 主体两列布局：左侧最近行程宽表 + 右侧充电大盘 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 最近行程宽表 (占 2 列) */}
        <div className="lg:col-span-2 bg-zinc-900/70 border border-zinc-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Route className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">最近行程记录</h3>
                <p className="text-xs text-zinc-400">最新完成的车辆驾驶轨迹与能耗详情</p>
              </div>
            </div>
            <Link
              href="/drives"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium bg-zinc-800/60 hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-700/50 transition-colors"
            >
              <span>查看全部行程</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800/80">
                  <th className="pb-3 font-semibold">开始时间</th>
                  <th className="pb-3 font-semibold">行程起止点</th>
                  <th className="pb-3 font-semibold">里程 / 耗时</th>
                  <th className="pb-3 font-semibold">电量消耗</th>
                  <th className="pb-3 font-semibold">能耗 (Wh/km)</th>
                  <th className="pb-3 font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                {drives.slice(0, 5).map((drive) => (
                  <tr key={drive.id} className="hover:bg-zinc-800/40 transition-colors group">
                    <td className="py-3 font-mono text-zinc-400">
                      {formatDateTime(drive.start_date)}
                    </td>
                    <td className="py-3 max-w-xs truncate">
                      <div className="font-medium text-white truncate">{drive.end_address}</div>
                      <div className="text-[11px] text-zinc-500 truncate">从 {drive.start_address}</div>
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-white">{formatDistance(drive.distance)}</span>
                      <span className="text-zinc-500 ml-1">({formatDuration(drive.duration_min)})</span>
                    </td>
                    <td className="py-3 font-medium text-emerald-400">
                      {drive.start_battery_level}% → {drive.end_battery_level}%
                      <span className="text-zinc-500 text-[11px] ml-1">({formatEnergy(drive.consumption_kwh)})</span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 font-mono text-zinc-200">
                        {formatEfficiency(drive.efficiency_wh_km)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/drives/${drive.id}`}
                        className="text-tesla-blue hover:text-blue-400 font-medium hover:underline inline-flex items-center gap-0.5"
                      >
                        轨迹详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 最近充电卡片大盘 (占 1 列) */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">充电速览</h3>
                <p className="text-xs text-zinc-400">补能记录与花费</p>
              </div>
            </div>
            <Link
              href="/charges"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium"
            >
              <span>更多</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-4 space-y-3 flex-1">
            {charges.slice(0, 4).map((charge) => (
              <div
                key={charge.id}
                className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3 hover:border-zinc-700 transition-all text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white truncate max-w-[180px]">
                    {charge.address}
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    +{formatEnergy(charge.charge_energy_added)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>{formatDateTime(charge.start_date)}</span>
                  <span className="text-amber-400 font-medium">{formatCurrency(charge.cost)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-zinc-500 text-[10px]">
                  <span>电量: {charge.start_battery_level}% → {charge.end_battery_level}%</span>
                  <span>耗时 {formatDuration(charge.duration_min)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
