'use client';

import React from 'react';
import Link from 'next/link';
import { LifetimeStats, EnergyBreakdown } from '@/types';
import { SavingsAnalysis } from '@/lib/queries';
import { useViewModeStore } from '@/store/useViewModeStore';
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
}

export function StatsClientView({ stats, savings, energy }: StatsClientViewProps) {
  const { isMobileLayout } = useViewModeStore();

  return (
    <div className={`space-y-4 pb-24 pt-2 px-3 mx-auto ${isMobileLayout ? 'max-w-lg' : 'max-w-6xl'}`}>
      {/* 顶部总览卡片 */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 rounded-3xl border border-zinc-800 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">综合能效与统计大盘</h1>
              <p className="text-xs text-zinc-400 mt-0.5">全生命周期电量去向、行车 vs 停车漏电深度分析</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            总里程 {stats.total_distance_km} km
          </span>
        </div>
      </div>

      {/* 🌟 4 大二级专属专项入口网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* 1. 电池健康 */}
        <Link
          href="/stats/battery"
          className="bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-2xl p-3.5 shadow-md transition-all active:scale-[0.98] flex flex-col justify-between group"
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
          className="bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-2xl p-3.5 shadow-md transition-all active:scale-[0.98] flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-white">行车足迹热力</div>
            <div className="text-[11px] text-blue-400 mt-0.5 font-medium">全省轨迹 · 常去地点</div>
          </div>
        </Link>

        {/* 3. 月度账单 */}
        <Link
          href="/stats/reports"
          className="bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-2xl p-3.5 shadow-md transition-all active:scale-[0.98] flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-white">月度能耗账单</div>
            <div className="text-[11px] text-purple-400 mt-0.5 font-medium">月度月报 · 用车开销</div>
          </div>
        </Link>

        {/* 4. 气温能耗 */}
        <Link
          href="/stats/temperature"
          className="bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-2xl p-3.5 shadow-md transition-all active:scale-[0.98] flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
              <ThermometerSun className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-white">气温与能耗关联</div>
            <div className="text-[11px] text-amber-400 mt-0.5 font-medium">夏冬气温 · 能效分布</div>
          </div>
        </Link>
      </div>

      {/* ⚡ 核心 1：行车耗电 vs 停车漏电全景拆解 */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
            <span>电量流向与消耗对比</span>
          </h2>
          <span className="text-xs text-zinc-400">累计充入 {energy.total_energy_added_kwh} kWh</span>
        </div>

        {/* 双色对比进度条 */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800">
            <div
              className="bg-blue-500 h-full transition-all"
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
            <span className="text-blue-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              行车动力耗电 {energy.driving_energy_kwh} kWh ({energy.driving_percent}%)
            </span>
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              停车静置损耗 {energy.parking_drain_kwh} kWh ({energy.parking_percent}%)
            </span>
          </div>
        </div>

        {/* 4 维指标网格 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs">
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
            <div className="text-zinc-400 text-[11px]">行车综合能耗</div>
            <div className="text-base font-bold text-white mt-1">{stats.avg_efficiency_wh_km} <span className="text-[10px] text-zinc-400 font-normal">Wh/km</span></div>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
            <div className="text-zinc-400 text-[11px]">停车静置漏电</div>
            <div className="text-base font-bold text-amber-400 mt-1">~{energy.parking_drain_kwh} <span className="text-[10px] text-zinc-400 font-normal">kWh</span></div>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
            <div className="text-zinc-400 text-[11px]">充电桩转化效率</div>
            <div className="text-base font-bold text-emerald-400 mt-1">{energy.charging_efficiency_percent}%</div>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
            <div className="text-zinc-400 text-[11px]">当前电池留存</div>
            <div className="text-base font-bold text-blue-400 mt-1">{energy.remaining_in_battery_kwh} <span className="text-[10px] text-zinc-400 font-normal">kWh</span></div>
          </div>
        </div>
      </div>

      {/* ⏱️ 核心 2：停车状态与时间分布 */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>车辆静置状态与待机分析</span>
          </h2>
          <span className="text-xs text-zinc-400">平均停车漏电约 0.04 kWh/h</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-zinc-950/50 p-3.5 rounded-2xl border border-zinc-800 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-zinc-400 text-[11px]">在线待机 / 哨兵监控</div>
              <div className="text-sm font-bold text-white mt-0.5">{energy.online_hours} 小时</div>
            </div>
          </div>

          <div className="bg-zinc-950/50 p-3.5 rounded-2xl border border-zinc-800 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-zinc-400 text-[11px]">离线静置 / 深度休眠</div>
              <div className="text-sm font-bold text-white mt-0.5">{energy.sleep_hours} 小时</div>
            </div>
          </div>
        </div>
      </div>

      {/* 💰 核心 3：对比燃油车省钱模型 */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>同级燃油车对比与省钱分析</span>
          </h2>
          <span className="text-xs text-emerald-400 font-semibold">
            已净省 {formatCurrency(savings.saved_cost)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
          <div className="bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800">
            <div className="text-[11px] text-zinc-400">实际家充总电费</div>
            <div className="text-sm font-bold text-amber-400 mt-1">{formatCurrency(savings.total_charge_cost)}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">¥0.069 / km</div>
          </div>

          <div className="bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800">
            <div className="text-[11px] text-zinc-400">同里程油车油费</div>
            <div className="text-sm font-bold text-zinc-300 mt-1">{formatCurrency(savings.fuel_equivalent_cost)}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">按 8.0L/100km</div>
          </div>

          <div className="bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800">
            <div className="text-[11px] text-zinc-400">累计节省燃油</div>
            <div className="text-sm font-bold text-emerald-400 mt-1">{savings.fuel_liters_saved} <span className="text-[10px] font-normal">升</span></div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">减排 {savings.co2_reduced_kg}kg CO₂</div>
          </div>
        </div>
      </div>
    </div>
  );
}
