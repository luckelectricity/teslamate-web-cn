import React from 'react';
import Link from 'next/link';
import { fetchVisitedLocations, fetchDrives, fetchFootprintDrives } from '@/lib/queries';
import { ArrowLeft, MapPin, Home, Compass, Route } from 'lucide-react';
import { FootprintMap } from '@/components/map/FootprintMap';

export default async function FootprintPage() {
  const [locations, drives, paths] = await Promise.all([
    fetchVisitedLocations(),
    fetchDrives(undefined, 50, 0),
    fetchFootprintDrives(),
  ]);

  const totalDistance = drives.reduce((s, d) => s + d.distance, 0);

  return (
    <div className="space-y-4 pb-24 pt-2 px-3 max-w-5xl mx-auto">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <Link
          href="/stats"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回统计大盘</span>
        </Link>
        <span className="text-xs text-zinc-400 font-mono">陕西省 · 西安/咸阳区域</span>
      </div>

      {/* 概览大卡片 (整齐单行对齐防挤压) */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-4 sm:p-5 rounded-3xl border border-zinc-800 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-red-500/10 text-red-500 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white whitespace-nowrap truncate">
                全景行车足迹大地图
              </h1>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                记录全部历史道路轨迹 · 自动缩放聚焦
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 shrink-0 whitespace-nowrap">
            已探索 {totalDistance.toFixed(0)} km
          </span>
        </div>

        {/* 3 维严格单行对齐指标卡片 */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-zinc-950/60 p-2.5 sm:p-3 rounded-2xl border border-zinc-800/60 flex flex-col justify-center">
            <div className="text-[11px] text-zinc-400 whitespace-nowrap truncate">轨迹段数</div>
            <div className="text-sm sm:text-base font-bold text-red-400 mt-1 whitespace-nowrap">
              {paths.length} <span className="text-[10px] text-zinc-400 font-normal">段</span>
            </div>
          </div>

          <div className="bg-zinc-950/60 p-2.5 sm:p-3 rounded-2xl border border-zinc-800/60 flex flex-col justify-center">
            <div className="text-[11px] text-zinc-400 whitespace-nowrap truncate">常驻地点</div>
            <div className="text-sm sm:text-base font-bold text-white mt-1 whitespace-nowrap">
              {locations.length} <span className="text-[10px] text-zinc-400 font-normal">个</span>
            </div>
          </div>

          <div className="bg-zinc-950/60 p-2.5 sm:p-3 rounded-2xl border border-zinc-800/60 flex flex-col justify-center">
            <div className="text-[11px] text-zinc-400 whitespace-nowrap truncate">单次最长</div>
            <div className="text-sm sm:text-base font-bold text-emerald-400 mt-1 whitespace-nowrap">
              {Math.max(...drives.map((d) => d.distance), 0).toFixed(1)} <span className="text-[10px] text-zinc-400 font-normal">km</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🗺️ 全景自适应足迹大地图 */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-3.5 sm:p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Route className="w-4 h-4 text-red-500" />
            <span>全量行车足迹网络 (高德暗色高精图层)</span>
          </h2>
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            重复路段已自然加深加亮
          </span>
        </div>

        <FootprintMap paths={paths} locations={locations} height="540px" />
      </div>

      {/* 📍 常驻地点排行榜 */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span>常去地点驻留统计榜</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {locations.map((loc, idx) => (
            <div
              key={loc.name}
              className="bg-zinc-950/50 hover:bg-zinc-800/40 border border-zinc-800/80 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 font-mono text-[11px] flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-white flex items-center gap-1.5 truncate">
                    {loc.is_home && <Home className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    <span className="truncate">{loc.name}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    已累计停靠 {loc.visit_count} 次
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 ml-2">
                <div className="font-bold text-zinc-200">{loc.total_parking_hours} 小时</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">累计驻留时长</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
