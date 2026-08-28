'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { ParkingPoint } from '@/types';

interface ParkingDetailChartsProps {
  points: ParkingPoint[];
}

export function ParkingDetailCharts({ points }: ParkingDetailChartsProps) {
  if (!points || points.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-zinc-500">
        该停车段暂无高频采样数据（车辆处于深度睡眠省电状态）
      </div>
    );
  }

  const times = points.map((p) => {
    const d = new Date(p.date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  const socs = points.map((p) => p.battery_level);
  const ranges = points.map((p) => p.ideal_battery_range_km);
  const temps = points.map((p) => p.outside_temp ?? p.inside_temp ?? 28);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#18181b',
      borderColor: '#27272a',
      textStyle: { color: '#f4f4f5', fontSize: 12 },
    },
    legend: {
      data: ['电量 SOC (%)', '理想续航 (km)', '环境温度 (°C)'],
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
        name: '电量/续航',
        nameTextStyle: { color: '#71717a', fontSize: 10 },
        splitLine: { lineStyle: { color: '#27272a' } },
        axisLabel: { color: '#71717a', fontSize: 10 },
      },
      {
        type: 'value',
        name: '温度(°C)',
        nameTextStyle: { color: '#71717a', fontSize: 10 },
        splitLine: { show: false },
        axisLabel: { color: '#71717a', fontSize: 10 },
      },
    ],
    series: [
      {
        name: '电量 SOC (%)',
        type: 'line',
        data: socs,
        smooth: true,
        itemStyle: { color: '#10b981' },
        lineStyle: { width: 2 },
      },
      {
        name: '理想续航 (km)',
        type: 'line',
        data: ranges,
        smooth: true,
        itemStyle: { color: '#3b82f6' },
        lineStyle: { width: 2 },
      },
      {
        name: '环境温度 (°C)',
        type: 'line',
        yAxisIndex: 1,
        data: temps,
        smooth: true,
        itemStyle: { color: '#f59e0b' },
        lineStyle: { width: 1.5, type: 'dashed' },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '260px', width: '100%' }} />;
}
