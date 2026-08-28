import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchParkingDetail } from '@/lib/queries';
import { formatDuration, formatDateTime } from '@/lib/formatters';
import { Moon, Shield, ArrowLeft, Clock, MapPin, Zap, Thermometer, Battery } from 'lucide-react';
import { ParkingDetailCharts } from '@/components/charts/ParkingDetailCharts';

export async function generateStaticParams() {
  return [{ id: '301' }, { id: '300' }];
}

interface ParkingDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ParkingDetailPage({ params }: ParkingDetailPageProps) {
  const parkingId = parseInt(params.id, 10);
  if (isNaN(parkingId)) notFound();

  const parking = await fetchParkingDetail(parkingId);
  if (!parking) notFound();

  const isHealthy = parking.range_lost_km <= 1.5;

  return (
    <div className="space-y-4 pb-24 pt-2 px-3 max-w-4xl mx-auto">
      {/* 顶部返回导航 */}
      <div className="flex items-center justify-between">
        <Link
          href="/parking"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回停车流水</span>
        </Link>
        <span className="text-xs text-zinc-400 font-mono">段编号 #{parking.id}</span>
      </div>

      {/* 核心卡片 */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Moon className="w-5 h-5 text-purple-400" />
                <span>停车静置能耗详情</span>
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                parking.is_home ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-zinc-800 text-zinc-300'
              }`}>
                {parking.address}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              {formatDateTime(parking.start_date)} ➔ {formatDateTime(parking.end_date)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              isHealthy ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {isHealthy ? '✅ 休眠健康' : '⚠️ 待机耗电活跃'}
            </span>
          </div>
        </div>

        {/* 4 维关键指标 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400">停放时长</div>
            <div className="text-base font-bold text-white mt-0.5">{formatDuration(parking.duration_min)}</div>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400">电量与续航变化</div>
            <div className="text-base font-bold text-amber-400 mt-0.5">
              {parking.has_charge ? '补电完成' : `-${parking.range_lost_km} km`}
            </div>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400">静置损耗电量</div>
            <div className="text-base font-bold text-zinc-200 mt-0.5">
              {parking.has_charge ? '--' : `~${parking.energy_lost_kwh} kWh`}
            </div>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400">平均漏电速率</div>
            <div className="text-base font-bold text-purple-400 mt-0.5 font-mono">
              {parking.has_charge ? '--' : `${parking.drain_rate_kwh_per_hour.toFixed(3)} kW`}
            </div>
          </div>
        </div>
      </div>

      {/* 📈 停车期间电量与气温走势图 */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 shadow-xl">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <Battery className="w-4 h-4 text-emerald-400" />
          <span>停车期间电量与环境温度走势</span>
        </h2>
        <ParkingDetailCharts points={parking.points} />
      </div>

      {/* 诊断小贴士 */}
      <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-4 text-xs text-zinc-400 space-y-1.5">
        <div className="font-semibold text-zinc-200">💡 静态漏电诊断与分析</div>
        <p>• 正常特斯拉车辆在深度休眠状态下的漏电速率约为 0.01~0.03 kWh/h（每天约 1%~2%）。</p>
        <p>• 开启哨兵模式时，由于车载行车电脑和环视摄像头持续工作，功耗约为 0.2~0.3 kWh/h（每小时约掉电 0.3%~0.5%）。</p>
      </div>
    </div>
  );
}
