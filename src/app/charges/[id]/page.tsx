import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchChargeDetail } from '@/lib/queries';
import { formatEnergy, formatDuration, formatCurrency, formatDateTime } from '@/lib/formatters';
import { Zap, Home, ArrowLeft, Clock, MapPin, BatteryCharging, Gauge } from 'lucide-react';
import { ChargeDetailCharts } from '@/components/charts/ChargeDetailCharts';

export async function generateStaticParams() {
  return [{ id: '201' }, { id: '200' }];
}

interface ChargeDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ChargeDetailPage({ params }: ChargeDetailPageProps) {
  const chargeId = parseInt(params.id, 10);
  if (isNaN(chargeId)) notFound();

  const charge = await fetchChargeDetail(chargeId);
  if (!charge) notFound();

  const efficiency = charge.charge_energy_used > 0 
    ? ((charge.charge_energy_added / charge.charge_energy_used) * 100).toFixed(1) 
    : '91.0';

  return (
    <div className="space-y-4 pb-24 pt-2 px-3 max-w-4xl mx-auto">
      {/* 返回导航 */}
      <div className="flex items-center justify-between">
        <Link
          href="/charges"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回充电记录</span>
        </Link>
        <span className="text-xs text-zinc-400 font-mono">充电记录 #{charge.id}</span>
      </div>

      {/* 核心概览卡片 */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span>充电过程与功率详情</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {charge.charger_type || '家用 7kW 交流慢充'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              {formatDateTime(charge.start_date)} ➔ {formatDateTime(charge.end_date)}
            </p>
          </div>

          <div>
            <span className="text-xl font-bold text-amber-400">
              {formatCurrency(charge.cost)}
            </span>
          </div>
        </div>

        {/* 4 维关键指标 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400">充入电量</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">+{formatEnergy(charge.charge_energy_added)}</div>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400">电量变化</div>
            <div className="text-base font-bold text-white mt-0.5">
              {charge.start_battery_level}% ➔ {charge.end_battery_level}%
            </div>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400">充电时长</div>
            <div className="text-base font-bold text-white mt-0.5">{formatDuration(charge.duration_min)}</div>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400">桩端转化效率</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">{efficiency}%</div>
          </div>
        </div>
      </div>

      {/* 📈 充电功率与 SOC 爬升图 */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 shadow-xl">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <BatteryCharging className="w-4 h-4 text-emerald-400" />
          <span>充电功率曲线与电池 SOC 爬升</span>
        </h2>
        <ChargeDetailCharts points={charge.points} />
      </div>
    </div>
  );
}
