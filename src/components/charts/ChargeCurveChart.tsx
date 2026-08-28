'use client';

import React, { useEffect, useRef } from 'react';
import { ChargePoint } from '@/types';
import { format, parseISO } from 'date-fns';

interface ChargeCurveChartProps {
  charges: ChargePoint[];
  height?: string;
}

export function ChargeCurveChart({ charges, height = '280px' }: ChargeCurveChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initChart() {
      if (!chartRef.current || charges.length === 0) return;
      const echarts = await import('echarts');

      if (!isMounted) return;

      if (!instanceRef.current) {
        instanceRef.current = echarts.init(chartRef.current, 'dark');
      }

      const times = charges.map((c) => {
        try {
          return format(parseISO(c.date), 'HH:mm:ss');
        } catch {
          return c.date;
        }
      });
      const socs = charges.map((c) => c.battery_level);
      const powers = charges.map((c) => c.charger_power);

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(24, 24, 27, 0.9)',
          borderColor: '#3f3f46',
          textStyle: { color: '#e4e4e7', fontSize: 12 },
          axisPointer: { type: 'cross' },
        },
        legend: {
          data: ['充电功率 (kW)', '电池电量 (%)'],
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
            name: '功率 (kW)',
            position: 'left',
            axisLine: { lineStyle: { color: '#3f3f46' } },
            splitLine: { lineStyle: { color: '#27272a' } },
            axisLabel: { color: '#71717a', fontSize: 10 },
          },
          {
            type: 'value',
            name: '电量 (%)',
            min: 0,
            max: 100,
            position: 'right',
            splitLine: { show: false },
            axisLine: { lineStyle: { color: '#3f3f46' } },
            axisLabel: { color: '#71717a', fontSize: 10 },
          },
        ],
        series: [
          {
            name: '充电功率 (kW)',
            type: 'line',
            smooth: true,
            showSymbol: false,
            data: powers,
            itemStyle: { color: '#10b981' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.0)' },
              ]),
            },
          },
          {
            name: '电池电量 (%)',
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            showSymbol: false,
            data: socs,
            itemStyle: { color: '#3b82f6' },
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
  }, [charges]);

  return (
    <div
      ref={chartRef}
      style={{ height }}
      className="w-full rounded-2xl bg-zinc-900/60 p-2 border border-zinc-800"
    />
  );
}
