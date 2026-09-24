'use client';

import React from 'react';
import Link from 'next/link';
import { Car, DriveSummary, ChargeSummary, LifetimeStats, SocDataPoint, StateTimelineItem } from '@/types';
import { CarStatusHero } from '@/components/car/CarStatusHero';
import { SocHistoryChart } from '@/components/charts/SocHistoryChart';
import { ActivityTimeline } from '@/components/charts/ActivityTimeline';
import { formatDistance, formatDuration, formatEnergy, formatEfficiency, formatCurrency, formatDateTime } from '@/lib/formatters';
import { 
  Route, 
  Zap, 
  TrendingUp, 
  Gauge, 
  Activity, 
  ChevronRight, 
  MapPin, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

interface DesktopDashboardProps {
  car: Car;
  drives: DriveSummary[];
  charges: ChargeSummary[];
  stats: LifetimeStats;
  socHistory: SocDataPoint[];
  statesTimeline: StateTimelineItem[];
}

export function DesktopDashboard({
  car,
  drives,
  charges,
  stats,
  socHistory,
  statesTimeline,
}: DesktopDashboardProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. 车辆核心全景卡片 (CyberUI 官方 Studio 3D 渲染 + 3D 紧致翻转卡片) */}
      <CarStatusHero car={car} />

      {/* 2. 核心指标卡 (清晰通透、CyberUI 风格) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cyber-card rounded-2xl p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">车辆总里程</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {stats.total_distance_km.toLocaleString('zh-CN')}
            </span>
            <span className="text-xs text-zinc-500">km</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>已记录 {stats.logged_distance_km ? stats.logged_distance_km.toFixed(1) : stats.total_distance_km} km</span>
            <span className="text-blue-400 font-mono">{stats.total_drives} 段连贯行程</span>
          </div>
        </div>

        <div className="cyber-card rounded-2xl p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">平均行驶能耗</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
              {stats.avg_efficiency_wh_km}
            </span>
            <span className="text-xs text-zinc-500">Wh/km</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>累计消耗 {stats.total_energy_kwh} kWh</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">能效极佳</span>
          </div>
        </div>

        <div className="cyber-card rounded-2xl p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">充电累计充入</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {stats.total_charge_energy_added.toLocaleString('zh-CN')}
            </span>
            <span className="text-xs text-zinc-500">kWh</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>补能记录</span>
            <span className="text-amber-400 font-mono">共 {stats.total_charges} 次</span>
          </div>
        </div>

        <div className="cyber-card rounded-2xl p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">累计充电总花费</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-purple-400 tracking-tight">
              ¥{stats.total_charge_cost.toLocaleString('zh-CN', { minimumFractionDigits: 1 })}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>平均每公里仅</span>
            <span className="text-purple-400 font-mono">
              ¥{(stats.total_charge_cost / Math.max(1, stats.total_distance_km)).toFixed(2)} / km
            </span>
          </div>
        </div>
      </div>

      {/* 3. 核心图表行：左侧 SOC 历史与等效续航曲线 + 右侧 24 小时状态时间线 (对齐 CyberUI 核心面板) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SocHistoryChart data={socHistory} />
        <ActivityTimeline data={statesTimeline} />
      </div>

      {/* 4. 主体分栏：左侧最近行程卡片流 + 右侧补能与深度分析下钻 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：最近行程记录 (2 列) */}
        <div className="lg:col-span-2 cyber-card rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Route className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">最近出行记录</h3>
                <p className="text-xs text-zinc-400">点击单项直接下钻查看高精度轨迹与海拔能耗剖面</p>
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

          <div className="mt-4 space-y-2.5">
            {drives.slice(0, 5).map((drive) => (
              <Link
                key={drive.id}
                href={`/drives/${drive.id}`}
                className="block p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-800/80 hover:border-blue-500/30 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate max-w-sm">
                        {drive.end_address || '目的地'}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {formatDateTime(drive.start_date)}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate mt-1">
                      从 {drive.start_address || '起点'}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-white font-mono">
                        {formatDistance(drive.distance)}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        耗时 {formatDuration(drive.duration_min)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400 font-mono">
                        {formatEfficiency(drive.efficiency_wh_km)}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {drive.start_battery_level}% → {drive.end_battery_level}%
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 右侧：补能速览 + 深度分析中心入口 (1 列) */}
        <div className="space-y-6">
          {/* 最近补能 */}
          <div className="cyber-card rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">补能速览</h3>
                  <p className="text-xs text-zinc-400">充电度数与花费</p>
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

            <div className="mt-4 space-y-2.5">
              {charges.slice(0, 3).map((charge) => (
                <Link
                  key={charge.id}
                  href={`/charges/${charge.id}`}
                  className="block p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-800/80 hover:border-emerald-500/30 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs truncate max-w-[160px]">
                      {charge.address}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold text-xs">
                      +{formatEnergy(charge.charge_energy_added)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-zinc-400 text-[11px]">
                    <span>{formatDateTime(charge.start_date)}</span>
                    <span className="text-amber-400 font-medium">{formatCurrency(charge.cost)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 深度分析下钻入口 */}
          <div className="cyber-card rounded-3xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white tracking-wide">专属深度数据大盘</h4>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/stats/battery"
                className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/30 active:scale-95 transition-all group"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit mb-2 group-hover:scale-110 transition-transform">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">电池健康度</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">衰减曲线与循环</div>
              </Link>

              <Link
                href="/stats/footprint"
                className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-blue-500/30 active:scale-95 transition-all group"
              >
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 w-fit mb-2 group-hover:scale-110 transition-transform">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">全景足迹热力</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">全量高频发光地图</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
