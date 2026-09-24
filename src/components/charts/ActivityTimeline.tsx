'use client';

import React, { useState, useMemo } from 'react';
import { StateTimelineItem } from '@/types';
import { Clock } from 'lucide-react';
import { formatDuration } from '@/lib/formatters';

interface ActivityTimelineProps {
  data: StateTimelineItem[];
  className?: string;
}

const STATE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  driving: { label: '行驶中', color: '#00f0ff', bg: 'bg-cyan-400' },
  charging: { label: '充电中', color: '#10b981', bg: 'bg-emerald-500' },
  online: { label: '在线唤醒', color: '#f59e0b', bg: 'bg-amber-400' },
  asleep: { label: '休眠睡眠', color: '#818cf8', bg: 'bg-indigo-400' },
  offline: { label: '离线断连', color: '#52525b', bg: 'bg-zinc-600' },
};

function formatTimelineTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
}

export function ActivityTimeline({ data, className = '' }: ActivityTimelineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 计算总时长 (分钟)
  const totalDuration = useMemo(() => {
    if (!data || data.length === 0) return 1440;
    return data.reduce((sum, item) => sum + (item.duration_min || 1), 0);
  }, [data]);

  // 动态生成过去 24 小时各阶段的绝对钟点刻度
  const timeLabels = useMemo(() => {
    const now = Date.now();
    const h24Ago = new Date(now - 24 * 3600 * 1000);
    const h18Ago = new Date(now - 18 * 3600 * 1000);
    const h12Ago = new Date(now - 12 * 3600 * 1000);
    const h6Ago = new Date(now - 6 * 3600 * 1000);
    const formatH = (d: Date) => d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

    return [
      { label: `24h前 (${formatH(h24Ago)})` },
      { label: `18h (${formatH(h18Ago)})` },
      { label: `12h (${formatH(h12Ago)})` },
      { label: `6h (${formatH(h6Ago)})` },
      { label: `现在 (${formatH(new Date(now))})`, isNow: true },
    ];
  }, []);

  const activeItem = hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex] : null;

  return (
    <div className={`cyber-card rounded-2xl p-4 shadow-xl ${className}`}>
      {/* 标题与状态图例 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
            24 小时车辆活动时间线
          </h3>
        </div>

        {/* 状态图例 (行驶、充电、休眠、在线、离线) */}
        <div className="flex items-center gap-2.5 text-[10px] text-zinc-400 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>行驶</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>充电</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>休眠</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>在线</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-zinc-600" />
            <span>离线</span>
          </div>
        </div>
      </div>

      {/* 活动甘特条容器 */}
      <div className="relative pt-1 pb-1">
        {/* 彩色时间条 */}
        <div className="h-7 w-full rounded-xl overflow-hidden flex bg-zinc-950/90 border border-zinc-800 p-0.5 shadow-inner">
          {data.map((item, idx) => {
            const widthPct = Math.max(0.5, (item.duration_min / Math.max(1, totalDuration)) * 100);
            const cfg = STATE_CONFIG[item.state] || STATE_CONFIG.offline;
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(hoveredIndex === idx ? null : idx)}
                className={`h-full transition-all cursor-pointer relative ${cfg.bg} ${
                  isHovered ? 'brightness-125 z-10 scale-y-110 shadow-lg ring-1 ring-white/50' : 'opacity-90 hover:opacity-100'
                }`}
                style={{ width: `${widthPct}%` }}
                title={`${cfg.label} · 持续 ${formatDuration(item.duration_min)}`}
              />
            );
          })}
        </div>

        {/* 动态 Tooltip 提示 */}
        <div className="min-h-[38px] mt-2.5">
          {activeItem ? (
            <div className="p-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs shadow-2xl flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background:
                      STATE_CONFIG[activeItem.state]?.color || '#52525b',
                  }}
                />
                <span className="font-semibold text-white">
                  {STATE_CONFIG[activeItem.state]?.label || '离线'}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {formatTimelineTime(activeItem.start_date)} ~ {formatTimelineTime(activeItem.end_date)}
                </span>
              </div>
              <div className="font-mono text-cyan-400 text-xs font-bold">
                持续 {formatDuration(activeItem.duration_min)}
              </div>
            </div>
          ) : (
            <div className="py-2 px-3 rounded-xl bg-zinc-950/40 border border-zinc-800/40 text-[11px] text-zinc-500 flex items-center justify-between">
              <span>点击或移动至色块查看具体活动区间</span>
              <span className="font-mono">总计 24 小时</span>
            </div>
          )}
        </div>

        {/* 24 小时时间刻度 */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1.5 border-t border-zinc-800/60">
          {timeLabels.map((t, idx) => (
            <span
              key={idx}
              className={t.isNow ? 'text-cyan-400 font-bold' : idx === 0 ? 'text-zinc-400' : 'text-zinc-500'}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
