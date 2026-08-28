'use client';

import React, { useEffect, useRef } from 'react';
import { PositionPoint } from '@/types';
import { format, parseISO } from 'date-fns';

interface DriveProfileChartProps {
  positions: PositionPoint[];
  height?: string;
}

/**
 * 平滑并修复 GPS 海拔数据 (过滤 0 值并进行滑动窗口移动均值滤波)
 */
function smoothElevations(rawElevations: number[]): number[] {
  if (rawElevations.length === 0) return [];

  // 1. 寻找全局有效基准均值 (如西安区域 ~390m~420m)
  const validVals = rawElevations.filter((e) => e > 50 && e < 6000);
  const fallback = validVals.length > 0 ? validVals[0] : 400;

  // 2. 过滤 0 与异常点，前向/后向填充
  const filled: number[] = [];
  let lastValid = fallback;
  for (let i = 0; i < rawElevations.length; i++) {
    const val = rawElevations[i];
    if (val > 50 && val < 6000) {
      lastValid = val;
      filled.push(val);
    } else {
      filled.push(lastValid);
    }
  }

  // 3. 滑动窗口平滑滤波 (Window Size = 15) 提取整体宏观地形趋势
  const windowSize = Math.max(5, Math.min(25, Math.floor(filled.length / 10)));
  const smoothed: number[] = [];
  for (let i = 0; i < filled.length; i++) {
    const start = Math.max(0, i - windowSize);
    const end = Math.min(filled.length, i + windowSize + 1);
    const slice = filled.slice(start, end);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    smoothed.push(Math.round(avg));
  }

  return smoothed;
}

export function DriveProfileChart({ positions, height = '280px' }: DriveProfileChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initChart() {
      if (!chartRef.current || positions.length === 0) return;
      const echarts = await import('echarts');

      if (!isMounted) return;

      if (!instanceRef.current) {
        instanceRef.current = echarts.init(chartRef.current, 'dark');
      }

      const times = positions.map((p) => {
        try {
          return format(parseISO(p.date), 'HH:mm:ss');
        } catch {
          return p.date;
        }
      });
      const speeds = positions.map((p) => Math.round(p.speed));
      const powers = positions.map((p) => Math.round(p.power));
      const rawElevations = positions.map((p) => Number(p.elevation || 0));
      const smoothedElevations = smoothElevations(rawElevations);

      const minElev = Math.min(...smoothedElevations);
      const maxElev = Math.max(...smoothedElevations);

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(24, 24, 27, 0.95)',
          borderColor: '#3f3f46',
          textStyle: { color: '#e4e4e7', fontSize: 12 },
          axisPointer: { type: 'cross' },
        },
        legend: {
          data: ['车速 (km/h)', '功率 (kW)', '海拔趋势 (m)'],
          textStyle: { color: '#a1a1aa', fontSize: 11 },
          top: 0,
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '35px',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: times,
          axisLine: { lineStyle: { color: '#3f3f46' } },
          axisLabel: { color: '#71717a', fontSize: 10 },
        },
        yAxis: [
          {
            type: 'value',
            name: '速度/功率',
            position: 'left',
            axisLine: { lineStyle: { color: '#3f3f46' } },
            splitLine: { lineStyle: { color: '#27272a' } },
            axisLabel: { color: '#71717a', fontSize: 10 },
          },
          {
            type: 'value',
            name: '海拔(m)',
            position: 'right',
            min: Math.max(0, minElev - 30),
            max: maxElev + 30,
            splitLine: { show: false },
            axisLine: { lineStyle: { color: '#3f3f46' } },
            axisLabel: { color: '#71717a', fontSize: 10 },
          },
        ],
        series: [
          // 底层：柔和平缓的海拔趋势背景
          {
            name: '海拔趋势 (m)',
            type: 'line',
            yAxisIndex: 1,
            smooth: 0.6,
            showSymbol: false,
            data: smoothedElevations,
            itemStyle: { color: '#10b981' },
            lineStyle: { width: 1.5, opacity: 0.6 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(16, 185, 129, 0.12)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.0)' },
              ]),
            },
            z: 1,
          },
          // 车速主曲线
          {
            name: '车速 (km/h)',
            type: 'line',
            smooth: true,
            showSymbol: false,
            data: speeds,
            itemStyle: { color: '#3b82f6' },
            lineStyle: { width: 2.2 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.0)' },
              ]),
            },
            z: 3,
          },
          // 功率主曲线 (加速红 / 回收绿)
          {
            name: '功率 (kW)',
            type: 'line',
            smooth: true,
            showSymbol: false,
            data: powers,
            itemStyle: { color: '#ef4444' },
            lineStyle: { width: 1.8 },
            z: 4,
          },
        ],
      };

      instanceRef.current.setOption(option);

      const handleResize = () => {
        instanceRef.current?.resize();
      };
      window.addEventListener('resize', handleResize);
    }

    initChart();

    return () => {
      isMounted = false;
      if (instanceRef.current) {
        instanceRef.current.dispose();
        instanceRef.current = null;
      }
    };
  }, [positions]);

  return (
    <div
      ref={chartRef}
      style={{ height }}
      className="w-full rounded-2xl bg-zinc-900/60 p-2 border border-zinc-800"
    />
  );
}
