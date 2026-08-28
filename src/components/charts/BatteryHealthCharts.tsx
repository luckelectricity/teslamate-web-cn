'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';

interface BatteryHealthChartsProps {
  currentKm: number;
  fullRange: number;
}

export function BatteryHealthCharts({ currentKm, fullRange }: BatteryHealthChartsProps) {
  const kmSteps = [0, 5000, 10000, 20000, 30000, 50000, 80000, 100000];
  const baselineRanges = [433, 428, 424, 420, 417, 412, 406, 400]; // 行业大数据均值
  const myCarData = [
    [0, 433],
    [currentKm, fullRange],
  ];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#18181b',
      borderColor: '#27272a',
      textStyle: { color: '#f4f4f5', fontSize: 12 },
    },
    legend: {
      data: ['行业平均衰减基准 (km)', '您的爱车实测 (km)'],
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
      data: kmSteps.map((k) => `${k} km`),
      axisLine: { lineStyle: { color: '#3f3f46' } },
      axisLabel: { color: '#71717a', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      min: 380,
      max: 440,
      name: '满电续航 (km)',
      nameTextStyle: { color: '#71717a', fontSize: 10 },
      splitLine: { lineStyle: { color: '#27272a' } },
      axisLabel: { color: '#71717a', fontSize: 10 },
    },
    series: [
      {
        name: '行业平均衰减基准 (km)',
        type: 'line',
        data: baselineRanges,
        smooth: true,
        itemStyle: { color: '#71717a' },
        lineStyle: { width: 1.5, type: 'dashed' },
      },
      {
        name: '您的爱车实测 (km)',
        type: 'line',
        data: [433, fullRange, null, null, null, null, null, null],
        itemStyle: { color: '#10b981' },
        lineStyle: { width: 3 },
        markPoint: {
          data: [
            {
              name: '当前点',
              coord: [0, fullRange],
              value: `${fullRange} km`,
              itemStyle: { color: '#10b981' },
            },
          ],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '260px', width: '100%' }} />;
}
