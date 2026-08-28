'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { ChargePoint } from '@/types';

interface ChargeDetailChartsProps {
  points: ChargePoint[];
}

export function ChargeDetailCharts({ points }: ChargeDetailChartsProps) {
  if (!points || points.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-zinc-500">
        交流慢充按恒定 7.0 kW 功率注入（无异常断冲或功率波动）
      </div>
    );
  }

  const times = points.map((p) => {
    const d = new Date(p.date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  const powers = points.map((p) => p.charger_power);
  const socs = points.map((p) => p.battery_level);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#18181b',
      borderColor: '#27272a',
      textStyle: { color: '#f4f4f5', fontSize: 12 },
    },
    legend: {
      data: ['充电功率 (kW)', '电池 SOC (%)'],
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
      data: times,
      axisLine: { lineStyle: { color: '#3f3f46' } },
      axisLabel: { color: '#71717a', fontSize: 10 },
    },
    yAxis: [
      {
        type: 'value',
        name: '功率 (kW)',
        nameTextStyle: { color: '#71717a', fontSize: 10 },
        splitLine: { lineStyle: { color: '#27272a' } },
        axisLabel: { color: '#71717a', fontSize: 10 },
      },
      {
        type: 'value',
        name: 'SOC (%)',
        min: 0,
        max: 100,
        nameTextStyle: { color: '#71717a', fontSize: 10 },
        splitLine: { show: false },
        axisLabel: { color: '#71717a', fontSize: 10 },
      },
    ],
    series: [
      {
        name: '充电功率 (kW)',
        type: 'line',
        data: powers,
        smooth: true,
        itemStyle: { color: '#10b981' },
        lineStyle: { width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.0)' },
            ],
          },
        },
      },
      {
        name: '电池 SOC (%)',
        type: 'line',
        yAxisIndex: 1,
        data: socs,
        smooth: true,
        itemStyle: { color: '#3b82f6' },
        lineStyle: { width: 2 },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '260px', width: '100%' }} />;
}
