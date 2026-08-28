'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { TemperatureEfficiencyPoint } from '@/types';

interface TemperatureChartsProps {
  points: TemperatureEfficiencyPoint[];
}

export function TemperatureCharts({ points }: TemperatureChartsProps) {
  const temps = points.map((p) => `${p.temp}°C`);
  const whs = points.map((p) => p.avg_wh_km);
  const counts = points.map((p) => p.drive_count);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#18181b',
      borderColor: '#27272a',
      textStyle: { color: '#f4f4f5', fontSize: 12 },
    },
    legend: {
      data: ['平均能耗 (Wh/km)', '行程次数 (次)'],
      textStyle: { color: '#a1a1aa', fontSize: 11 },
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '5%',
      top: '18%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: temps,
      axisLine: { lineStyle: { color: '#3f3f46' } },
      axisLabel: { color: '#71717a', fontSize: 10 },
    },
    yAxis: [
      {
        type: 'value',
        name: '能耗 (Wh/km)',
        min: 100,
        max: 220,
        nameTextStyle: { color: '#71717a', fontSize: 10 },
        splitLine: { lineStyle: { color: '#27272a' } },
        axisLabel: { color: '#71717a', fontSize: 10 },
      },
      {
        type: 'value',
        name: '行程数 (次)',
        nameTextStyle: { color: '#71717a', fontSize: 10 },
        splitLine: { show: false },
        axisLabel: { color: '#71717a', fontSize: 10 },
      },
    ],
    series: [
      {
        name: '平均能耗 (Wh/km)',
        type: 'line',
        data: whs,
        smooth: true,
        itemStyle: { color: '#f59e0b' },
        lineStyle: { width: 2.5 },
      },
      {
        name: '行程次数 (次)',
        type: 'bar',
        yAxisIndex: 1,
        data: counts,
        itemStyle: { color: 'rgba(59, 130, 246, 0.4)', borderRadius: [4, 4, 0, 0] },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '260px', width: '100%' }} />;
}
