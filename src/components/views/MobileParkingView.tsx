'use client';

import React from 'react';
import Link from 'next/link';
import { ParkingSummary, EnergyBreakdown } from '@/types';
import { formatDuration, formatDateTime, formatEnergy } from '@/lib/formatters';
import { Moon, Shield, Clock, ChevronRight, Zap, BatteryCharging, AlertCircle, Home, MapPin } from 'lucide-react';

interface MobileParkingViewProps {
  parkings: ParkingSummary[];
  energy: EnergyBreakdown;
}

export function MobileParkingView({ parkings, energy }: MobileParkingViewProps) {
  const totalParkingHours = parkings.reduce((sum, p) => sum + p.duration_min, 0) / 60.0;
  const totalDrainKwh = parkings.reduce((sum, p) => sum + (p.energy_lost_kwh || 0), 0);

  return (
    <div className="space-y-3 pb-24 pt-2 px-2.5 max-w-lg mx-auto">
      {/* 顶部统计汇总 */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-4 rounded-3xl border border-zinc-800 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">停车静置与漏电分析</h1>
              <p className="text-[11px] text-zinc-400">静置待机、休眠掉电明细与下钻诊断</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {parkings.length} 次停车
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-zinc-950/60 p-2.5 rounded-2xl border border-zinc-800/60">
            <div className="text-[10px] text-zinc-400">累计静置损耗</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">{totalDrainKwh.toFixed(1)} kWh</div>
          </div>
          <div className="bg-zinc-950/60 p-2.5 rounded-2xl border border-zinc-800/60">
            <div className="text-[10px] text-zinc-400">平均漏电速率</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">0.038 kWh/h</div>
          </div>
          <div className="bg-zinc-950/60 p-2.5 rounded-2xl border border-zinc-800/60">
            <div className="text-[10px] text-zinc-400">总静置时长</div>
            <div className="text-sm font-bold text-white mt-0.5">{totalParkingHours.toFixed(0)} 小时</div>
          </div>
        </div>
      </div>

      {/* 停车流水列表 */}
      <div className="space-y-2.5">
        {parkings.map((p) => {
          const batteryDiff = p.start_battery_level - p.end_battery_level;
          const isHighDrain = p.drain_rate_kwh_per_hour > 0.08;

          return (
            <Link
              key={p.id}
              href={`/parking/${p.id}`}
              className="block bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-2xl p-3.5 shadow-md transition-all active:scale-[0.99]"
            >
              {/* 头部：时间与地点 */}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/60">
                <span className="font-mono text-zinc-400">{formatDateTime(p.start_date)}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                  p.is_home 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                    : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {p.is_home ? <Home className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                  <span>{p.address}</span>
                </span>
              </div>

              {/* 中部：时长、掉电量、速率 */}
              <div className="mt-2.5 grid grid-cols-3 gap-2 text-center bg-zinc-950/40 p-2 rounded-xl border border-zinc-800/40 text-xs">
                <div>
                  <div className="text-[10px] text-zinc-400">停放时长</div>
                  <div className="font-semibold text-white mt-0.5 whitespace-nowrap">
                    {formatDuration(p.duration_min)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-zinc-400">掉电 / 续航</div>
                  <div className={`font-semibold mt-0.5 whitespace-nowrap ${
                    p.has_charge ? 'text-emerald-400' : p.range_lost_km > 5 ? 'text-amber-400' : 'text-zinc-200'
                  }`}>
                    {p.has_charge ? '期间已充电' : `-${p.range_lost_km} km`}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-zinc-400">漏电速率</div>
                  <div className="font-semibold text-zinc-300 mt-0.5 whitespace-nowrap">
                    {p.has_charge ? '--' : `${p.drain_rate_kwh_per_hour.toFixed(3)} kW`}
                  </div>
                </div>
              </div>

              {/* 底部：状态与下钻提示 */}
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400">
                <div className="flex items-center gap-1.5 truncate">
                  {p.has_charge ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> 家充补电完成
                    </span>
                  ) : p.range_lost_km <= 1.0 ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Moon className="w-3 h-3" /> 深度休眠良好 (微损耗)
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> 待机/哨兵唤醒活跃
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-0.5 text-purple-400 shrink-0 font-medium">
                  <span>能耗详情</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
