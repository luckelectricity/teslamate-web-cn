'use client';

import React from 'react';
import { Car } from '@/types';
import { BatteryRing } from './BatteryRing';
import { getCarStateInfo, formatTimeAgo } from '@/lib/formatters';
import {
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Thermometer,
  Gauge,
  MapPin,
  Disc,
  Cpu,
} from 'lucide-react';

interface CarStatusHeroProps {
  car: Car;
}

export function CarStatusHero({ car }: CarStatusHeroProps) {
  const stateInfo = getCarStateInfo(car.state);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900/95 via-zinc-900/80 to-zinc-950/95 border border-zinc-800/80 p-4 sm:p-6 shadow-2xl backdrop-blur-2xl transition-all">
      {/* 顶部微光环境氛围 */}
      <div className="absolute top-0 right-1/4 w-80 h-32 bg-red-600/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute -top-10 -left-10 w-64 h-32 bg-blue-600/5 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* 顶部：车名与状态指示栏 */}
      <div className="relative z-10 flex items-center justify-between gap-2 pb-4 border-b border-zinc-800/60">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white truncate">
              {car.name || `Model ${car.model}`}
            </h1>
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60">
              Model {car.model} {car.trim_badging ? `(${car.trim_badging})` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1 font-mono">
            <span className="truncate">{car.vin}</span>
          </div>
        </div>

        {/* 呼吸光效状态徽章 */}
        <div className="shrink-0">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${stateInfo.bg} ${stateInfo.color} ${stateInfo.border}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
            </span>
            <span className="whitespace-nowrap">{stateInfo.text}</span>
            {car.since && (
              <span className="text-[10px] opacity-75 font-normal whitespace-nowrap hidden sm:inline">
                ({formatTimeAgo(car.since)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 中部核心区：电量环 + 4 大核心卡片（严格单行无折行设计） */}
      <div className="relative z-10 mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* 电量环 */}
        <div className="md:col-span-4 flex justify-center py-1">
          <BatteryRing
            level={car.battery_level}
            usableLevel={car.usable_battery_level}
            rangeKm={car.ideal_battery_range_km}
            isCharging={car.state === 'charging'}
          />
        </div>

        {/* 4 项核心状态卡片（防止折行） */}
        <div className="md:col-span-8 grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* 1. 总里程 */}
          <div className="bg-zinc-900/80 hover:bg-zinc-800/60 border border-zinc-800/80 rounded-2xl p-3 flex items-center gap-3 transition-colors">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <Gauge className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-zinc-400 font-medium whitespace-nowrap">总里程</div>
              <div className="text-sm sm:text-base font-bold text-white tracking-tight whitespace-nowrap truncate mt-0.5">
                {car.odometer ? car.odometer.toFixed(1) : '0.0'} <span className="text-[10px] font-normal text-zinc-400">km</span>
              </div>
            </div>
          </div>

          {/* 2. 车内/车外温度 */}
          <div className="bg-zinc-900/80 hover:bg-zinc-800/60 border border-zinc-800/80 rounded-2xl p-3 flex items-center gap-3 transition-colors">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
              <Thermometer className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-zinc-400 font-medium whitespace-nowrap">车内 / 室外温</div>
              <div className="text-sm sm:text-base font-bold text-white tracking-tight whitespace-nowrap truncate mt-0.5">
                {car.inside_temp != null ? `${car.inside_temp}°` : '--'} <span className="text-zinc-500 font-normal">/</span> {car.outside_temp != null ? `${car.outside_temp}°` : '--'}
              </div>
            </div>
          </div>

          {/* 3. 车锁状态 */}
          <div className="bg-zinc-900/80 hover:bg-zinc-800/60 border border-zinc-800/80 rounded-2xl p-3 flex items-center gap-3 transition-colors">
            <div className={`p-2 rounded-xl shrink-0 ${
              car.is_locked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {car.is_locked ? <Lock className="w-4 h-4 sm:w-5 sm:h-5" /> : <Unlock className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-zinc-400 font-medium whitespace-nowrap">门锁状态</div>
              <div className="text-sm sm:text-base font-bold text-white tracking-tight whitespace-nowrap truncate mt-0.5">
                {car.is_locked ? '已锁定' : '未上锁'}
              </div>
            </div>
          </div>

          {/* 4. 哨兵模式 */}
          <div className="bg-zinc-900/80 hover:bg-zinc-800/60 border border-zinc-800/80 rounded-2xl p-3 flex items-center gap-3 transition-colors">
            <div className={`p-2 rounded-xl shrink-0 ${
              car.is_sentry_mode ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {car.is_sentry_mode ? <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" /> : <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-zinc-400 font-medium whitespace-nowrap">哨兵模式</div>
              <div className="text-sm sm:text-base font-bold text-white tracking-tight whitespace-nowrap truncate mt-0.5">
                {car.is_sentry_mode ? '已开启' : '已关闭'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部：当前定位与四轮胎压 */}
      <div className="relative z-10 mt-4 pt-3.5 border-t border-zinc-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
        {/* 地址 */}
        <div className="flex items-center gap-1.5 text-zinc-300 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="truncate font-medium text-zinc-300">
            {car.address || '已定位 (陕西省西安/咸阳周边)'}
          </span>
        </div>

        {/* 四轮气压 */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-zinc-900/90 px-3 py-1 rounded-xl border border-zinc-800 text-[11px] whitespace-nowrap">
          <Disc className="w-3 h-3 text-zinc-500 shrink-0" />
          <span className="text-zinc-400">胎压:</span>
          <span className="font-mono font-medium text-zinc-200">
            前 {car.tire_pressure_fl || 3.0}/{car.tire_pressure_fr || 3.0} · 后 {car.tire_pressure_rl || 3.0}/{car.tire_pressure_rr || 3.0} bar
          </span>
        </div>
      </div>
    </div>
  );
}
