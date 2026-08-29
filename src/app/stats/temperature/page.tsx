import React from 'react';
import Link from 'next/link';
import { fetchTemperatureStats } from '@/lib/queries';
import { ArrowLeft, ThermometerSun, Sun, Snowflake, Zap } from 'lucide-react';
import { TemperatureCharts } from '@/components/charts/TemperatureCharts';

export const revalidate = 0;

export default async function TemperaturePage() {
  const points = await fetchTemperatureStats();

  return (
    <div className="space-y-4 pb-24 pt-2 px-3 max-w-4xl mx-auto">
      {/* 顶部返回导航 */}
      <div className="flex items-center justify-between">
        <Link
          href="/stats"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回统计大盘</span>
        </Link>
        <span className="text-xs text-zinc-400 font-mono">环境温度能效模型</span>
      </div>

      {/* 核心卡片 */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400">
              <ThermometerSun className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">气温对能耗与续航影响</h1>
              <p className="text-xs text-zinc-400 mt-0.5">不同室外气温下的实测百公里能耗 (Wh/km) 变化规律</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            实测温区 25°C ~ 36°C
          </span>
        </div>

        {/* 📈 气温与能耗散点/走势图 */}
        <div className="pt-2">
          <TemperatureCharts points={points} />
        </div>
      </div>

      {/* 气温能耗知识科普 */}
      <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-4 text-xs text-zinc-400 space-y-1.5">
        <div className="font-semibold text-zinc-200">💡 特斯拉气温能耗特性</div>
        <p>• <strong>黄金温区 (20°C~28°C)</strong>：电池无需额外热管理，空调负荷轻，能效最高（通常在 120~145 Wh/km）。</p>
        <p>• <strong>高温酷暑 (&gt;32°C)</strong>：座舱大功率制冷及电池组主动水冷运转，能耗会轻微上升 10%~15%（约 155~175 Wh/km）。</p>
      </div>
    </div>
  );
}
