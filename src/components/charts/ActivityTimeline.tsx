'use client';

import React, { useState } from 'react';
import { StateTimelineItem } from '@/types';
import { Clock } from 'lucide-react';
import { formatDuration } from '@/lib/formatters';

interface ActivityTimelineProps {
  data: StateTimelineItem[];
  className?: string;
}

const STATE_CONFIG = {
  driving: { label: '行驶中', color: '#00f0ff', bg: 'bg-cyan-400' },
  charging: { label: '充电中', color: '#10b981', bg: 'bg-emerald-500' },
  online: { label: '在线唤醒', color: '#f59e0b', bg: 'bg-amber-500' },
  asleep: { label: '休眠睡眠', color: '#818cf8', bg: 'bg-indigo-400' },
  offline: { label: '离线', color: '#52525b', bg: 'bg-zinc-600' },
};

export function ActivityTimeline({ data, className = '' }: ActivityTimelineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 计算总分钟数
  const totalDuration = data.reduce((sum, item) => sum + (item.duration_min || 1), 0);

  return (
    <div className={`cyber-card rounded-2xl p-4 shadow-xl ${className}`}>
      {/* 标题与状态图例 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
            24 小时车辆活动时间线
          </h3>
        </div>

        {/* 状态图例 */}
        <div className="flex items-center gap-3 text-[10px] text-zinc-400 flex-wrap">
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
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>在线</span>
          </div>
        </div>
      </div>

      {/* 活动甘特条容器 */}
      <div className="relative pt-1 pb-1">
        {/* 彩色时间条 */}
        <div className="h-6 w-full rounded-xl overflow-hidden flex bg-zinc-950/80 border border-zinc-800 p-0.5 shadow-inner">
          {data.map((item, idx) => {
            const widthPct = Math.max(1, (item.duration_min / Math.max(1, totalDuration)) * 100);
            const cfg = STATE_CONFIG[item.state] || STATE_CONFIG.offline;
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`h-full transition-all cursor-pointer relative ${cfg.bg} ${
                  isHovered ? 'brightness-125 z-10 scale-y-110' : 'opacity-90 hover:opacity-100'
                }`}
                style={{ width: `${widthPct}%` }}
              />
            );
          })}
        </div>

        {/* 浮层 Tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div className="mt-2.5 p-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs shadow-2xl flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background:
                    STATE_CONFIG[data[hoveredIndex].state]?.color || '#52525b',
                }}
              />
              <span className="font-semibold text-white">
                {STATE_CONFIG[data[hoveredIndex].state]?.label || '离线'}
              </span>
            </div>
            <div className="font-mono text-zinc-300 text-[11px]">
              持续 {formatDuration(data[hoveredIndex].duration_min)}
            </div>
          </div>
        )}

        {/* 24 小时时间刻度 */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mt-2 pt-1 border-t border-zinc-800/40">
          <span>24小时前</span>
          <span>18h</span>
          <span>12h</span>
          <span>6h</span>
          <span className="text-cyan-400 font-bold">现在</span>
        </div>
      </div>
    </div>
  );
}
