'use client';

import React from 'react';
import Link from 'next/link';
import { LifetimeStats, EnergyBreakdown, DrivingRecordsByPeriod, CarMilestonesData } from '@/types';
import { SavingsAnalysis } from '@/lib/queries';
import { useViewModeStore } from '@/store/useViewModeStore';
import { DrivingRecordsCard } from '@/components/cards/DrivingRecordsCard';
import { CarMilestonesCard } from '@/components/cards/CarMilestonesCard';
import { 
  Zap, 
  TrendingDown, 
  Moon, 
  Shield, 
  DollarSign, 
  BatteryCharging, 
  Leaf, 
  Car, 
  Clock, 
  ChevronRight, 
  Activity, 
  MapPin, 
  Calendar, 
  ThermometerSun 
} from 'lucide-react';
import { formatCurrency, formatEnergy, formatDuration } from '@/lib/formatters';

interface StatsClientViewProps {
  stats: LifetimeStats;
  savings: SavingsAnalysis;
  energy: EnergyBreakdown;
  records: DrivingRecordsByPeriod;
  milestones: CarMilestonesData;
}

export function StatsClientView({ stats, savings, energy, records, milestones }: StatsClientViewProps) {
  const { isMobileLayout } = useViewModeStore();

  return (
    <div className={`space-y-4 pb-24 pt-2 px-3 mx-auto ${isMobileLayout ? 'max-w-lg' : 'max-w-6xl'}`}>
      {/* 1. 顶部总览卡片 (CyberUI 风格：全生命总里程与核心指标) */}
      <div className="cyber-card p-4 sm:p-5 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">
                综合能效与全生命大盘
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                电量流向去向剖析 · 行车 vs 停车静置漏电
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center">
            <span className="inline-flex items-baseline gap-1 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono whitespace-nowrap">
              <span>{stats.total_distance_km.toFixed(1)}</span>
              <span className="text-[10px] text-emerald-400/80 font-sans uppercase">km</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. 🎯 爱车里程碑成就精简胶囊 (只显示当前完成的成就，留二级入口查看完整成就墙) */}
      <CarMilestonesCard initialData={milestones} />

      {/* 3. 🏆 驾驶生涯极值榜单 (支持 月/半年/全年/全部 周期切换) */}
      <DrivingRecordsCard records={records} />

      {/* 4. 🌟 4 大二级专属专项入口网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* 1. 电池健康 */}
        <Link
          href="/stats/battery"
          className="cyber-card rounded-2xl p-3.5 shadow-md flex flex-col justify-between group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-white">电池健康度</div>
            <div className="text-[11px] text-emerald-400 mt-0.5 font-medium">99.8% · 衰减极低</div>
          </div>
        </Link>

        {/* 2. 行车足迹 */}
        <Link
          href="/stats/footprint"
          className="cyber-card rounded-2xl p-3.5 shadow-md flex flex-col justify-between group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-white">行车足迹热力</div>
            <div className="text-[11px] text-blue-400 mt-0.5 font-medium">全域轨迹 · 高频发光</div>
          </div>
        </Link>

        {/* 3. 月度账单 */}
        <Link
          href="/stats/reports"
          className="cyber-card rounded-2xl p-3.5 shadow-md flex flex-col justify-between group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-white">月度能耗账单</div>
            <div className="text-[11px] text-purple-400 mt-0.5 font-medium">月度用车战报</div>
          </div>
        </Link>

        {/* 4. 气温能耗 */}
        <Link
          href="/stats/temperature"
          className="cyber-card rounded-2xl p-3.5 shadow-md flex flex-col justify-between group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
              <ThermometerSun className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-white">气温能耗关联</div>
            <div className="text-[11px] text-amber-400 mt-0.5 font-medium">温度效率拟合</div>
          </div>
        </Link>
      </div>

      {/* 5. ⚡ 电量流向与消耗对比 */}
      <div className="cyber-card rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
            <span>电量流向与消耗对比</span>
          </h2>
          <span className="text-xs text-zinc-400 font-mono">累计充入 {energy.total_energy_added_kwh} kWh</span>
        </div>

        {/* 双色对比进度条 */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800">
            <div
              className="bg-cyan-500 h-full transition-all"
              style={{ width: `${energy.driving_percent}%` }}
              title={`行车耗电: ${energy.driving_percent}%`}
            />
            <div
              className="bg-amber-500 h-full transition-all"
              style={{ width: `${energy.parking_percent}%` }}
              title={`停车损耗: ${energy.parking_percent}%`}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-cyan-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              行车动力耗电 {energy.driving_energy_kwh} kWh ({energy.driving_percent}%)
            </span>
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              停车静置损耗 {energy.parking_drain_kwh} kWh ({energy.parking_percent}%)
            </span>
          </div>
        </div>

        {/* 4 维指标网格 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
            <div className="text-zinc-400 text-[11px]">行车综合能耗</div>
            <div className="text-base font-bold text-white font-mono mt-1">
              {stats.avg_efficiency_wh_km} <span className="text-[10px] text-zinc-400 font-normal">Wh/km</span>
            </div>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
            <div className="text-zinc-400 text-[11px]">停车静置漏电</div>
            <div className="text-base font-bold text-amber-400 font-mono mt-1">
              ~{energy.parking_drain_kwh} <span className="text-[10px] text-zinc-400 font-normal">kWh</span>
            </div>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
            <div className="text-zinc-400 text-[11px]">充电桩转化效率</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-1">
              {energy.charging_efficiency_percent}%
            </div>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
            <div className="text-zinc-400 text-[11px]">当前电池留存</div>
            <div className="text-base font-bold text-cyan-400 font-mono mt-1">
              {energy.remaining_in_battery_kwh} <span className="text-[10px] text-zinc-400 font-normal">kWh</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. 💰 相较燃油车省钱对比分析 */}
      <div className="cyber-card rounded-3xl p-4 sm:p-5 shadow-lg space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span>用车开销与燃油车对比</span>
          </h2>
          <span className="text-xs text-emerald-400 font-semibold">
            已省下 {formatCurrency(savings.saved_cost)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="text-zinc-400 text-[11px]">电费总花费 (家充+快充)</div>
            <div className="text-base font-bold text-white font-mono mt-1">
              {formatCurrency(savings.total_charge_cost)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              平均每公里约 ¥{(savings.total_charge_cost / Math.max(1, stats.total_distance_km)).toFixed(2)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="text-zinc-400 text-[11px]">同里程燃油车油费 (8L/100km)</div>
            <div className="text-base font-bold text-amber-400 font-mono mt-1">
              {formatCurrency(savings.fuel_equivalent_cost)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              按 95# 汽油 ¥8.2/L 测算
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
