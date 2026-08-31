import React from 'react';
import Link from 'next/link';
import { fetchBatteryHealth, fetchCars } from '@/lib/queries';
import { ArrowLeft, Activity, BatteryCharging, Award } from 'lucide-react';
import { BatteryHealthCharts } from '@/components/charts/BatteryHealthCharts';

export const dynamic = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'auto' : 'force-dynamic';

export default async function BatteryHealthPage() {
  const [health, cars] = await Promise.all([
    fetchBatteryHealth(),
    fetchCars(),
  ]);
  const car = cars[0];
  const currentKm = car?.odometer || 699.9;

  return (
    <div className="space-y-4 pb-24 pt-2 px-3 max-w-4xl mx-auto">
      {/* 返回统计大盘 */}
      <div className="flex items-center justify-between">
        <Link
          href="/stats"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回统计大盘</span>
        </Link>
        <span className="text-xs text-zinc-400 font-mono">Model Y LFP 电池组</span>
      </div>

      {/* 核心卡片 */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-4 sm:p-5 rounded-3xl border border-zinc-800 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white whitespace-nowrap truncate">
                电池健康度与衰减估算
              </h1>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                磷酸铁锂 (LFP) 电池全生命周期状态监测
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0 whitespace-nowrap">
            <Award className="w-3.5 h-3.5" /> 健康度 {health.health_percent}%
          </span>
        </div>

        {/* 4 维核心指标 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-zinc-950/60 p-2.5 sm:p-3 rounded-2xl border border-zinc-800/60 flex flex-col justify-center">
            <div className="text-[11px] text-zinc-400 whitespace-nowrap truncate">满电推算续航</div>
            <div className="text-sm sm:text-base font-bold text-white mt-1 whitespace-nowrap">
              {health.estimated_full_range_km} <span className="text-[10px] text-zinc-400 font-normal">km</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 whitespace-nowrap truncate">出厂 433.0 km</div>
          </div>

          <div className="bg-zinc-950/60 p-2.5 sm:p-3 rounded-2xl border border-zinc-800/60 flex flex-col justify-center">
            <div className="text-[11px] text-zinc-400 whitespace-nowrap truncate">可用电池容量</div>
            <div className="text-sm sm:text-base font-bold text-emerald-400 mt-1 whitespace-nowrap">
              {health.current_usable_pack_kwh} <span className="text-[10px] text-zinc-400 font-normal">kWh</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 whitespace-nowrap truncate">标称 60.0 kWh</div>
          </div>

          <div className="bg-zinc-950/60 p-2.5 sm:p-3 rounded-2xl border border-zinc-800/60 flex flex-col justify-center">
            <div className="text-[11px] text-zinc-400 whitespace-nowrap truncate">慢充比例</div>
            <div className="text-sm sm:text-base font-bold text-blue-400 mt-1 whitespace-nowrap">
              {health.slow_charge_percent}% <span className="text-[10px] text-zinc-400 font-normal">慢充</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5 whitespace-nowrap truncate">4次家充 · 0次快充</div>
          </div>

          <div className="bg-zinc-950/60 p-2.5 sm:p-3 rounded-2xl border border-zinc-800/60 flex flex-col justify-center">
            <div className="text-[11px] text-zinc-400 whitespace-nowrap truncate">等效循环</div>
            <div className="text-sm sm:text-base font-bold text-purple-400 mt-1 whitespace-nowrap">
              {health.cycle_count} <span className="text-[10px] text-zinc-400 font-normal">次</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 whitespace-nowrap truncate">寿命 &gt;3000 次</div>
          </div>
        </div>
      </div>

      {/* 📈 衰减对比走势图 */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <BatteryCharging className="w-4 h-4 text-emerald-400" />
          <span>电池衰减走势对比 (基准线 vs 您的爱车)</span>
        </h2>
        <BatteryHealthCharts currentKm={currentKm} fullRange={health.estimated_full_range_km} />
      </div>

      {/* 电池保养建议 */}
      <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-4 text-xs text-zinc-400 space-y-1.5">
        <div className="font-semibold text-zinc-200">💡 磷酸铁锂 (LFP) 电池保养建议</div>
        <p>• 建议每周至少充满至 100% 一次，以便 BMS 电池管理系统完成电压校准，提升续航预估精度。</p>
        <p>• 当前 100% 采用家用 7kW 交流慢充，电池热负荷极小，健康状况处于巅峰极优状态。</p>
      </div>
    </div>
  );
}
