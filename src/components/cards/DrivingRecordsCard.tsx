'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Gauge,
  Navigation,
  Clock,
  Leaf,
  Zap,
  BatteryCharging,
  Mountain,
  ThermometerSnowflake,
  ThermometerSun,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { DrivingRecordsByPeriod, RecordPeriod } from '@/types';
import { formatDateTime } from '@/lib/formatters';

interface DrivingRecordsCardProps {
  records: DrivingRecordsByPeriod;
}

export function DrivingRecordsCard({ records }: DrivingRecordsCardProps) {
  const [activePeriod, setActivePeriod] = useState<RecordPeriod>('all');

  const periodOptions: { key: RecordPeriod; label: string }[] = [
    { key: 'month', label: '本月' },
    { key: 'half_year', label: '近半年' },
    { key: 'year', label: '近一年' },
    { key: 'all', label: '全部' },
  ];

  const currentRecords = records[activePeriod] || records.all;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-xl space-y-6">
      {/* 头部标题与周期切换器 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
            <Trophy className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-100">驾驶生涯极值榜</h2>
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                <Sparkles className="w-3 h-3" />
                智能合并行程
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              10分钟内临时锁车已自动合并为连贯行程并统计极值
            </p>
          </div>
        </div>

        {/* 周期切换 Tabs */}
        <div className="inline-flex p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 self-start sm:self-auto">
          {periodOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setActivePeriod(opt.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activePeriod === opt.key
                  ? 'bg-zinc-800 text-amber-400 font-semibold shadow-sm border border-zinc-700/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 极值指标网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. 最高极速 */}
        <RecordGridItem
          icon={<Gauge className="w-4 h-4 text-rose-400" />}
          iconBg="bg-rose-500/10 border-rose-500/20"
          title={currentRecords.max_speed.title}
          value={currentRecords.max_speed.formatted_value}
          unit={currentRecords.max_speed.unit}
          subText={currentRecords.max_speed.sub_text}
          date={currentRecords.max_speed.date}
          driveId={currentRecords.max_speed.drive_id}
          secondary={currentRecords.max_speed.secondary_value}
          valueColor="text-rose-400"
        />

        {/* 2. 单次最远里程 */}
        <RecordGridItem
          icon={<Navigation className="w-4 h-4 text-blue-400" />}
          iconBg="bg-blue-500/10 border-blue-500/20"
          title={currentRecords.longest_distance.title}
          value={currentRecords.longest_distance.formatted_value}
          unit={currentRecords.longest_distance.unit}
          subText={currentRecords.longest_distance.sub_text}
          date={currentRecords.longest_distance.date}
          driveId={currentRecords.longest_distance.drive_id}
          secondary={currentRecords.longest_distance.secondary_value}
          valueColor="text-blue-400"
        />

        {/* 3. 单次最长耗时 */}
        <RecordGridItem
          icon={<Clock className="w-4 h-4 text-indigo-400" />}
          iconBg="bg-indigo-500/10 border-indigo-500/20"
          title={currentRecords.longest_duration.title}
          value={currentRecords.longest_duration.formatted_value}
          unit={currentRecords.longest_duration.unit}
          subText={currentRecords.longest_duration.sub_text}
          date={currentRecords.longest_duration.date}
          driveId={currentRecords.longest_duration.drive_id}
          secondary={currentRecords.longest_duration.secondary_value}
          valueColor="text-indigo-400"
        />

        {/* 4. 黄金右脚 / 最佳能耗 */}
        <RecordGridItem
          icon={<Leaf className="w-4 h-4 text-emerald-400" />}
          iconBg="bg-emerald-500/10 border-emerald-500/20"
          title={currentRecords.best_efficiency.title}
          value={currentRecords.best_efficiency.formatted_value}
          unit={currentRecords.best_efficiency.unit}
          subText={currentRecords.best_efficiency.sub_text}
          date={currentRecords.best_efficiency.date}
          driveId={currentRecords.best_efficiency.drive_id}
          secondary={currentRecords.best_efficiency.secondary_value}
          valueColor="text-emerald-400"
        />

        {/* 5. 最大瞬时输出功率 */}
        <RecordGridItem
          icon={<Zap className="w-4 h-4 text-amber-400" />}
          iconBg="bg-amber-500/10 border-amber-500/20"
          title={currentRecords.max_power.title}
          value={currentRecords.max_power.formatted_value}
          unit={currentRecords.max_power.unit}
          subText={currentRecords.max_power.sub_text}
          date={currentRecords.max_power.date}
          driveId={currentRecords.max_power.drive_id}
          valueColor="text-amber-400"
        />

        {/* 6. 最强动能回收 */}
        <RecordGridItem
          icon={<BatteryCharging className="w-4 h-4 text-cyan-400" />}
          iconBg="bg-cyan-500/10 border-cyan-500/20"
          title={currentRecords.max_regen.title}
          value={currentRecords.max_regen.formatted_value}
          unit={currentRecords.max_regen.unit}
          subText={currentRecords.max_regen.sub_text}
          date={currentRecords.max_regen.date}
          driveId={currentRecords.max_regen.drive_id}
          valueColor="text-cyan-400"
        />

        {/* 7. 单次最大海拔爬升 */}
        <RecordGridItem
          icon={<Mountain className="w-4 h-4 text-teal-400" />}
          iconBg="bg-teal-500/10 border-teal-500/20"
          title={currentRecords.max_ascent.title}
          value={currentRecords.max_ascent.formatted_value}
          unit={currentRecords.max_ascent.unit}
          subText={currentRecords.max_ascent.sub_text}
          date={currentRecords.max_ascent.date}
          driveId={currentRecords.max_ascent.drive_id}
          valueColor="text-teal-400"
        />

        {/* 8. 极限气温出行 */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">极限气温出行</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 my-2">
            <div className="bg-zinc-900/60 rounded-lg p-2 border border-cyan-500/10">
              <div className="flex items-center gap-1 text-[11px] text-cyan-400">
                <ThermometerSnowflake className="w-3 h-3" />
                最低温
              </div>
              <div className="text-base font-bold text-zinc-100 mt-1 font-mono">
                {currentRecords.extreme_temp.lowest.formatted_value} <span className="text-xs font-normal text-zinc-400">°C</span>
              </div>
            </div>

            <div className="bg-zinc-900/60 rounded-lg p-2 border border-orange-500/10">
              <div className="flex items-center gap-1 text-[11px] text-orange-400">
                <ThermometerSun className="w-3 h-3" />
                最高温
              </div>
              <div className="text-base font-bold text-zinc-100 mt-1 font-mono">
                {currentRecords.extreme_temp.highest.formatted_value} <span className="text-xs font-normal text-zinc-400">°C</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 truncate">
            冷暖随行 · 纯电无畏气候
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecordGridItemProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  value: string;
  unit: string;
  subText?: string;
  date: string;
  driveId?: number;
  secondary?: string;
  valueColor: string;
}

function RecordGridItem({
  icon,
  iconBg,
  title,
  value,
  unit,
  subText,
  date,
  driveId,
  secondary,
  valueColor,
}: RecordGridItemProps) {
  const content = (
    <div className="group bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 hover:bg-zinc-950/90 transition-all h-full">
      <div>
        {/* 顶部标题与图标 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-medium">{title}</span>
          <div className={`w-7 h-7 rounded-lg ${iconBg} border flex items-center justify-center`}>
            {icon}
          </div>
        </div>

        {/* 极值主数值 */}
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className={`text-2xl font-black font-mono tracking-tight ${valueColor}`}>
            {value}
          </span>
          {unit && <span className="text-xs font-medium text-zinc-400">{unit}</span>}
        </div>

        {/* 描述与路线 */}
        {subText && (
          <p className="text-[11px] text-zinc-300 mt-1.5 line-clamp-1 group-hover:text-zinc-100 transition-colors">
            {subText}
          </p>
        )}
      </div>

      {/* 底部发生时间与附属标签 */}
      <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400">
        <span className="truncate">{formatDateTime(date)}</span>
        {secondary ? (
          <span className="text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 truncate max-w-[120px]">
            {secondary}
          </span>
        ) : driveId ? (
          <span className="inline-flex items-center gap-0.5 text-zinc-400 group-hover:text-zinc-200 transition-colors">
            查看行程 <ChevronRight className="w-3 h-3" />
          </span>
        ) : null}
      </div>
    </div>
  );

  if (driveId) {
    return (
      <Link href={`/drives/${driveId}`} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
