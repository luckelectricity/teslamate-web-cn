'use client';

import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { SocDataPoint } from '@/types';
import { BatteryCharging, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';

interface SocHistoryChartProps {
  data: SocDataPoint[];
  className?: string;
}

export function SocHistoryChart({ data, className = '' }: SocHistoryChartProps) {
  const [rangePreset, setRangePreset] = useState<'24h' | '7d'>('24h');

  // 计算最大估算续航里程 (Model Y 标称约 435~500 km)
  const maxRangeKm = useMemo(() => {
    let max = 0;
    for (const d of data) {
      if (d.rangeKm && d.soc > 0) {
        const est = (d.rangeKm / d.soc) * 100;
        if (est > max) max = est;
      }
    }
    return max > 0 ? Math.round(max) : 435;
  }, [data]);

  const option = useMemo(() => {
    const chartData = data.map((d) => [new Date(d.date).getTime(), d.soc]);

    return {
      backgroundColor: 'transparent',
      grid: {
        top: 25,
        right: 48,
        bottom: 30,
        left: 45,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 15, 20, 0.92)',
        borderColor: '#00f0ff',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: {
          color: '#ffffff',
          fontSize: 12,
        },
        formatter: (params: any[]) => {
          if (!params.length) return '';
          const p = params[0];
          const timeStr = formatDateTime(new Date(p.value[0]).toISOString());
          const soc = Math.round(p.value[1]);
          const range = Math.round((soc / 100) * maxRangeKm);
          return `
            <div style="font-weight: 600; font-family: monospace; color: #a1a1aa; margin-bottom: 4px;">${timeStr}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #00f0ff;"></span>
              <span style="color: #00f0ff; font-weight: bold; font-family: monospace; font-size: 13px;">${soc}%</span>
              <span style="color: #71717a; font-size: 11px;">(~${range} km)</span>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'time',
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
        },
        axisLabel: {
          color: '#71717a',
          fontSize: 10,
        },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          min: 0,
          max: 100,
          splitNumber: 4,
          axisLine: { show: false },
          axisLabel: {
            color: '#71717a',
            fontSize: 10,
            formatter: '{value}%',
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
          },
        },
        {
          type: 'value',
          min: 0,
          max: maxRangeKm,
          splitNumber: 4,
          position: 'right',
          axisLine: { show: false },
          axisLabel: {
            color: '#71717a',
            fontSize: 10,
            formatter: (v: number) => `${Math.round(v)}k`,
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'SOC',
          type: 'line',
          data: chartData,
          smooth: 0.4,
          symbol: 'none',
          sampling: 'lttb',
          lineStyle: {
            color: '#00f0ff',
            width: 2.5,
            shadowColor: 'rgba(0, 240, 255, 0.4)',
            shadowBlur: 10,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 240, 255, 0.3)' },
                { offset: 0.6, color: 'rgba(0, 240, 255, 0.08)' },
                { offset: 1, color: 'rgba(0, 240, 255, 0)' },
              ],
            },
          },
        },
      ],
    };
  }, [data, maxRangeKm]);

  return (
    <div className={`cyber-card rounded-2xl p-4 shadow-xl ${className}`}>
      {/* 头部标题与时段切换 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
            SOC 电池电量与续航历史
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-zinc-900/90 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
          <button
            onClick={() => setRangePreset('24h')}
            className={`px-2 py-0.5 rounded-md font-medium transition-all ${
              rangePreset === '24h'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            近 24 小时
          </button>
          <button
            onClick={() => setRangePreset('7d')}
            className={`px-2 py-0.5 rounded-md font-medium transition-all ${
              rangePreset === '7d'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            近 7 天
          </button>
        </div>
      </div>

      {/* ECharts 曲线 */}
      <div className="h-44 sm:h-52 w-full">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div>
    </div>
  );
}
