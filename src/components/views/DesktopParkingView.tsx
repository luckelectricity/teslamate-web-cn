'use client';

import React from 'react';
import Link from 'next/link';
import { ParkingSummary, EnergyBreakdown } from '@/types';
import { formatDuration, formatDateTime } from '@/lib/formatters';
import { Moon, Shield, Home, MapPin, ChevronRight, Zap } from 'lucide-react';

interface DesktopParkingViewProps {
  parkings: ParkingSummary[];
  energy: EnergyBreakdown;
}

export function DesktopParkingView({ parkings, energy }: DesktopParkingViewProps) {
  const totalParkingHours = parkings.reduce((sum, p) => sum + p.duration_min, 0) / 60.0;
  const totalDrainKwh = parkings.reduce((sum, p) => sum + (p.energy_lost_kwh || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 顶部统计汇总 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 p-5 rounded-3xl border border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-400" />
            <span>停车静置与漏电专项大盘</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            记录每次停车期间的静置耗电、休眠健康度及哨兵待机损耗
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-zinc-900 px-3.5 py-2 rounded-2xl border border-zinc-800">
            <div className="text-zinc-400">累计停车损耗</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">{totalDrainKwh.toFixed(1)} kWh</div>
          </div>
          <div className="bg-zinc-900 px-3.5 py-2 rounded-2xl border border-zinc-800">
            <div className="text-zinc-400">平均漏电速率</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">0.038 kWh/h</div>
          </div>
          <div className="bg-zinc-900 px-3.5 py-2 rounded-2xl border border-zinc-800">
            <div className="text-zinc-400">总静置时长</div>
            <div className="text-sm font-bold text-white mt-0.5">{totalParkingHours.toFixed(0)} 小时</div>
          </div>
        </div>
      </div>

      {/* 宽表记录 */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800/80">
                <th className="pb-3 font-semibold">开始停车时间</th>
                <th className="pb-3 font-semibold">结束停车时间</th>
                <th className="pb-3 font-semibold">停车地点</th>
                <th className="pb-3 font-semibold">停留时长</th>
                <th className="pb-3 font-semibold">掉电量 / 掉续航</th>
                <th className="pb-3 font-semibold">平均漏电速率</th>
                <th className="pb-3 font-semibold">状态评估</th>
                <th className="pb-3 font-semibold text-right">能耗详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
              {parkings.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3.5 font-mono text-zinc-400 whitespace-nowrap">
                    {formatDateTime(p.start_date)}
                  </td>
                  <td className="py-3.5 font-mono text-zinc-400 whitespace-nowrap">
                    {formatDateTime(p.end_date)}
                  </td>
                  <td className="py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium ${
                      p.is_home ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {p.is_home ? <Home className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      <span>{p.address}</span>
                    </span>
                  </td>
                  <td className="py-3.5 text-white font-medium whitespace-nowrap">
                    {formatDuration(p.duration_min)}
                  </td>
                  <td className="py-3.5 whitespace-nowrap font-semibold">
                    {p.has_charge ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> 期间已充电
                      </span>
                    ) : (
                      <span className={p.range_lost_km > 5 ? 'text-amber-400' : 'text-zinc-200'}>
                        -{p.energy_lost_kwh} kWh <span className="text-zinc-500 font-normal">(-{p.range_lost_km} km)</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-zinc-400 font-mono whitespace-nowrap">
                    {p.has_charge ? '--' : `${p.drain_rate_kwh_per_hour.toFixed(3)} kW`}
                  </td>
                  <td className="py-3.5">
                    {p.has_charge ? (
                      <span className="text-emerald-400 font-medium">家充补电</span>
                    ) : p.range_lost_km <= 1.0 ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-medium">
                        <Moon className="w-3 h-3" /> 深度休眠良好
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1 font-medium">
                        <Shield className="w-3 h-3" /> 哨兵/频繁唤醒
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-right whitespace-nowrap">
                    <Link
                      href={`/parking/${p.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 font-medium transition-colors text-xs border border-purple-500/20"
                    >
                      <span>下钻诊断</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
