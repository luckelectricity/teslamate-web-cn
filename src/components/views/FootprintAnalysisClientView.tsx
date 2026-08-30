'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { FootprintDrivePath, VisitedLocation, DriveSummary } from '@/types';
import { FootprintMap } from '@/components/map/FootprintMap';
import { formatDistance, formatDuration, formatEnergy, formatDateTime, formatEfficiency } from '@/lib/formatters';
import { 
  ArrowLeft, 
  MapPin, 
  Home, 
  Compass, 
  Route, 
  Calendar, 
  Navigation, 
  Zap, 
  Gauge, 
  Clock, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export type FootprintPeriod = 'today' | 'yesterday' | '3d' | '7d' | '30d' | 'all';

interface FootprintAnalysisClientViewProps {
  paths: FootprintDrivePath[];
  locations: VisitedLocation[];
  drives: DriveSummary[];
}

export function FootprintAnalysisClientView({
  paths,
  locations,
  drives,
}: FootprintAnalysisClientViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<FootprintPeriod>('all');
  const [activePathId, setActivePathId] = useState<number | null>(null);

  const periodOptions: { key: FootprintPeriod; label: string }[] = [
    { key: 'today', label: '今日行程' },
    { key: 'yesterday', label: '昨日行程' },
    { key: '3d', label: '近3日' },
    { key: '7d', label: '近7日' },
    { key: '30d', label: '近30日' },
    { key: 'all', label: '全部历史' },
  ];

  // 根据选定时间范围过滤轨迹与行程
  const { filteredPaths, filteredDrives } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const threeDaysAgo = now.getTime() - 3 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    let filterFn = (dateStr: string) => true;

    if (selectedPeriod === 'today') {
      filterFn = (dateStr: string) => new Date(dateStr).getTime() >= todayStart;
    } else if (selectedPeriod === 'yesterday') {
      filterFn = (dateStr: string) => {
        const t = new Date(dateStr).getTime();
        return t >= yesterdayStart && t < todayStart;
      };
    } else if (selectedPeriod === '3d') {
      filterFn = (dateStr: string) => new Date(dateStr).getTime() >= threeDaysAgo;
    } else if (selectedPeriod === '7d') {
      filterFn = (dateStr: string) => new Date(dateStr).getTime() >= sevenDaysAgo;
    } else if (selectedPeriod === '30d') {
      filterFn = (dateStr: string) => new Date(dateStr).getTime() >= thirtyDaysAgo;
    }

    return {
      filteredPaths: paths.filter((p) => filterFn(p.start_date)),
      filteredDrives: drives.filter((d) => filterFn(d.start_date)),
    };
  }, [paths, drives, selectedPeriod]);

  // 动态统计指标
  const totalDistance = filteredDrives.reduce((sum, d) => sum + (d.distance || 0), 0);
  const totalDurationMin = filteredDrives.reduce((sum, d) => sum + (d.duration_min || 0), 0);
  const totalConsumption = filteredDrives.reduce((sum, d) => sum + (d.consumption_kwh || 0), 0);
  const avgEfficiency = totalDistance > 0 ? Math.round((totalConsumption * 1000) / totalDistance) : 143;
  const maxSpeed = Math.max(...filteredDrives.map((d) => d.speed_max || 0), 0);

  return (
    <div className="space-y-4 pb-24 pt-2 px-3 max-w-6xl mx-auto">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <Link
          href="/stats"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回统计大盘</span>
        </Link>
        <span className="text-xs text-zinc-400 font-mono">行车轨迹与地理空间分析</span>
      </div>

      {/* 顶部时间维度筛选卡片 */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-4 sm:p-5 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-red-500/10 text-red-500 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white">
                  全景行车足迹大地图
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                  <Sparkles className="w-3 h-3" />
                  高精空间轨迹
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                支持按今日、昨日、近3日、近7日等多时间范围交互式地图分析
              </p>
            </div>
          </div>

          {/* 时间范围切换器 */}
          <div className="inline-flex p-1 bg-zinc-950/80 rounded-2xl border border-zinc-800 self-start md:self-auto overflow-x-auto max-w-full">
            {periodOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setSelectedPeriod(opt.key);
                  setActivePathId(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
                  selectedPeriod === opt.key
                    ? 'bg-zinc-800 text-red-400 font-bold shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 动态指标栏 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs pt-1">
          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400">探索行驶里程</div>
            <div className="text-base font-bold text-white mt-0.5">{totalDistance.toFixed(1)} <span className="text-[10px] text-zinc-400 font-normal">km</span></div>
          </div>

          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400">轨迹段数 / 耗时</div>
            <div className="text-base font-bold text-red-400 mt-0.5">
              {filteredPaths.length} <span className="text-[10px] text-zinc-400 font-normal">段 ({formatDuration(totalDurationMin)})</span>
            </div>
          </div>

          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400">百公里平均能耗</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {avgEfficiency} <span className="text-[10px] text-zinc-400 font-normal">Wh/km</span>
            </div>
          </div>

          <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/60">
            <div className="text-[11px] text-zinc-400">最高行驶极速</div>
            <div className="text-base font-bold text-indigo-400 mt-0.5">
              {maxSpeed} <span className="text-[10px] text-zinc-400 font-normal">km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🗺️ 全景高精地图分析中枢 */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-3.5 sm:p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Route className="w-4 h-4 text-red-500" />
            <span>行车轨迹网络 ({filteredPaths.length} 段已上图)</span>
          </h2>
          <span className="text-[11px] text-zinc-400">
            点击任意轨迹或下方卡片可高亮查看单程
          </span>
        </div>

        <FootprintMap
          paths={filteredPaths}
          locations={locations}
          height="540px"
          selectedPathId={activePathId}
          onSelectPath={(p) => setActivePathId(p ? p.id : null)}
        />
      </div>

      {/* 📋 选定时段的行程流水与轨迹卡片 */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-400" />
            <span>选定时段行程流水明细 ({filteredDrives.length} 条)</span>
          </h2>
          {activePathId && (
            <button
              onClick={() => setActivePathId(null)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              取消高亮单程
            </button>
          )}
        </div>

        {filteredDrives.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 space-y-1.5">
            <Calendar className="w-8 h-8 mx-auto text-zinc-600 mb-1" />
            <div className="text-sm font-medium text-zinc-400">选定时间范围内暂无行驶足迹</div>
            <p className="text-xs text-zinc-600">请选择「近3日」或「全部历史」查看历史轨迹大图</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredDrives.map((drive) => {
              const isSelected = activePathId === drive.id;
              return (
                <div
                  key={drive.id}
                  onClick={() => setActivePathId(isSelected ? null : drive.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-zinc-800/90 border-red-500/80 shadow-lg ring-1 ring-red-500/50'
                      : 'bg-zinc-950/50 hover:bg-zinc-800/40 border-zinc-800/80'
                  }`}
                >
                  <div>
                    {/* 头部：时间与里程 */}
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/60">
                      <span className="font-mono text-zinc-400">
                        {formatDateTime(drive.start_date)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {drive.is_merged && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium">
                            ⚡ 合并{drive.merged_count}段
                          </span>
                        )}
                        <span className="font-bold text-white text-sm">
                          {formatDistance(drive.distance)}
                        </span>
                      </div>
                    </div>

                    {/* 起止路线 */}
                    <div className="mt-2.5 space-y-1 text-xs">
                      <div className="flex items-center gap-1 text-zinc-300 truncate">
                        <span className="text-emerald-400 font-bold shrink-0">起</span>
                        <span className="truncate">{drive.start_address}</span>
                      </div>
                      <div className="flex items-center gap-1 text-zinc-400 truncate">
                        <span className="text-red-400 font-bold shrink-0">终</span>
                        <span className="truncate">{drive.end_address}</span>
                      </div>
                    </div>
                  </div>

                  {/* 底部指标与操作 */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/50 flex items-center justify-between text-[11px] text-zinc-400">
                    <div className="flex items-center gap-3">
                      <span>耗时 {formatDuration(drive.duration_min)}</span>
                      <span>能耗 {drive.efficiency_wh_km} Wh/km</span>
                      <span>极速 {drive.speed_max} km/h</span>
                    </div>

                    <Link
                      href={`/drives/${drive.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                    >
                      详情 <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
