'use client';

import React from 'react';
import Link from 'next/link';
import { Car, DriveSummary, ChargeSummary, LifetimeStats } from '@/types';
import { CarStatusHero } from '@/components/car/CarStatusHero';
import { formatDistance, formatDuration, formatEnergy, formatEfficiency, formatCurrency, formatDateTime } from '@/lib/formatters';
import { 
  Route, 
  Zap, 
  TrendingUp, 
  ChevronRight, 
  Activity, 
  MapPin, 
  Gauge,
  Sparkles
} from 'lucide-react';

interface MobileDashboardProps {
  car: Car;
  latestDrive?: DriveSummary;
  latestCharge?: ChargeSummary;
  stats: LifetimeStats;
}

export function MobileDashboard({ car, latestDrive, latestCharge, stats }: MobileDashboardProps) {
  return (
    <div className="space-y-3.5 pb-24 pt-1 px-3 max-w-lg mx-auto">
      {/* 1. 车辆状态 Hero (首屏视觉核心：电量环、续航、锁车、哨兵、温度与胎压) */}
      <CarStatusHero car={car} />

      {/* 2. 首屏核心必要数据胶囊 (简洁无堆叠，大字清晰) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="cyber-card rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span>累计里程</span>
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1 tracking-tight">
              {stats.total_distance_km ? stats.total_distance_km.toFixed(1) : '0.0'}
              <span className="text-xs text-zinc-500 font-sans ml-1">km</span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
            已记录
          </span>
        </div>

        <div className="cyber-card rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>综合能耗</span>
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1 tracking-tight">
              {stats.avg_efficiency_wh_km || 0}
              <span className="text-xs text-zinc-500 font-sans ml-1">Wh/km</span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            优异
          </span>
        </div>
      </div>

      {/* 3. 数据下钻入口卡片 1：最新行程动态 (轻触丝滑下钻至三级轨迹剖面) */}
      {latestDrive && (
        <div className="cyber-card rounded-2xl p-4 shadow-lg group">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-400">
                <Route className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">最近一次出行</span>
            </div>
            <Link
              href="/drives"
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-0.5 transition-colors"
            >
              <span>全部行程</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            </Link>
          </div>

          <Link
            href={`/drives/${latestDrive.id}`}
            className="block mt-3 active:opacity-80 transition-opacity"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">
                  {latestDrive.end_address || '行驶终点'}
                </div>
                <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                  始于 {latestDrive.start_address || '起点'}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-bold text-white font-mono">
                  {formatDistance(latestDrive.distance)}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  耗时 {formatDuration(latestDrive.duration_min)}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-zinc-800/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-emerald-400 font-mono font-medium">
                  {latestDrive.start_battery_level}% → {latestDrive.end_battery_level}%
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-[11px] text-zinc-400">
                  {formatEfficiency(latestDrive.efficiency_wh_km)}
                </span>
              </div>
              <div className="text-[11px] font-medium text-tesla-blue group-hover:text-blue-400 flex items-center gap-0.5">
                <span>轨迹剖面</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 4. 数据下钻入口卡片 2：最新补能动态 (轻触下钻至充电明细与曲线) */}
      {latestCharge && (
        <div className="cyber-card rounded-2xl p-4 shadow-lg group">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">最近一次补能</span>
            </div>
            <Link
              href="/charges"
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-0.5 transition-colors"
            >
              <span>全部充电</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            </Link>
          </div>

          <Link
            href={`/charges/${latestCharge.id}`}
            className="block mt-3 active:opacity-80 transition-opacity"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">
                  {latestCharge.address || '充电站点'}
                </div>
                <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                  {formatDateTime(latestCharge.start_date)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-bold text-emerald-400 font-mono">
                  +{formatEnergy(latestCharge.charge_energy_added)}
                </div>
                <div className="text-[10px] text-amber-400 font-medium mt-0.5">
                  {formatCurrency(latestCharge.cost)}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-zinc-800/50 flex items-center justify-between text-xs">
              <div className="text-[11px] text-zinc-400">
                电量 {latestCharge.start_battery_level}% → {latestCharge.end_battery_level}% ({formatDuration(latestCharge.duration_min)})
              </div>
              <div className="text-[11px] font-medium text-emerald-400 group-hover:text-emerald-300 flex items-center gap-0.5">
                <span>充电曲线</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 5. 数据深度分析快捷中心 (将高维数据全部收归为二级/三级入口，告别数据堆叠) */}
      <div className="cyber-card rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>深度数据分析中心</span>
          </span>
          <span className="text-[10px] text-zinc-500">点击进入二级专题</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Link
            href="/stats"
            className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all text-center flex flex-col items-center justify-center group"
          >
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-200">能耗与成就</span>
            <span className="text-[9px] text-zinc-500 mt-0.5">电量去向</span>
          </Link>

          <Link
            href="/stats/battery"
            className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all text-center flex flex-col items-center justify-center group"
          >
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-200">电池健康</span>
            <span className="text-[9px] text-emerald-400 mt-0.5">衰减估算</span>
          </Link>

          <Link
            href="/stats/footprint"
            className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all text-center flex flex-col items-center justify-center group"
          >
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 mb-1.5 group-hover:scale-110 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-200">足迹热力</span>
            <span className="text-[9px] text-blue-400 mt-0.5">全量地图</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
