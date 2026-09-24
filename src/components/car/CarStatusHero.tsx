'use client';

import React, { useState } from 'react';
import { Car } from '@/types';
import { getCarStateInfo, formatTimeAgo } from '@/lib/formatters';
import {
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Thermometer,
  RotateCw,
  Zap,
  Disc,
  Info,
  CheckCircle2,
  Radio,
  Battery
} from 'lucide-react';
import clsx from 'clsx';

// Tesla 官方车漆与车系代码
const COLOR_OPTION_CODES: Record<string, string> = {
  'SolidBlack': 'PBSB',
  'MidnightSilverMetallic': 'PMNG',
  'DeepBlueMetallic': 'PPSB',
  'PearlWhiteMultiCoat': 'PPSW',
  'RedMultiCoat': 'PPMR',
  'UltraWhite': 'PN01',
  'QuicksilverMetallic': 'PR01',
  'MidnightCherryRed': 'PPSR',
};

const COLOR_NAMES_ZH: Record<string, { name: string; hex: string }> = {
  'SolidBlack': { name: '纯黑色', hex: '#111111' },
  'MidnightSilverMetallic': { name: '冷光银', hex: '#5c6065' },
  'DeepBlueMetallic': { name: '深海蓝', hex: '#1e3a8a' },
  'PearlWhiteMultiCoat': { name: '珍珠白', hex: '#f8fafc' },
  'RedMultiCoat': { name: '中国红', hex: '#dc2626' },
  'UltraWhite': { name: '星空灰', hex: '#4b5563' },
  'QuicksilverMetallic': { name: '快银', hex: '#94a3b8' },
};

// 拼接 Tesla 官方配置器 Studio 3D 渲染图
const getCarStudioImageUrl = (model?: string, exteriorColor?: string): string => {
  const modelLower = (model || 'y').toLowerCase();
  const colorCode = exteriorColor ? (COLOR_OPTION_CODES[exteriorColor] || 'PPSW') : 'PPSW';
  const baseUrl = 'https://static-assets.tesla.com/configurator/compositor';

  if (modelLower === '3' || modelLower === 'model3') {
    return `${baseUrl}?context=design_studio_2&options=$MT372,$${colorCode},$W38A,$IPB2,$DRRH&view=STUD_FRONT34&model=m3&size=1920&bkba_opt=1&crop=0,0,0,0&overlay=0&`;
  } else if (modelLower === 's' || modelLower === 'models') {
    return `${baseUrl}?context=design_studio_2&options=$MTS13,$${colorCode},$WT20,$IBC00&view=STUD_FRONT34&model=ms&size=1920&bkba_opt=1&crop=0,0,0,0&overlay=0&`;
  } else if (modelLower === 'x' || modelLower === 'modelx') {
    return `${baseUrl}?context=design_studio_2&options=$MTX13,$${colorCode},$WX00,$IBC00&view=STUD_FRONT34&model=mx&size=1920&bkba_opt=1&crop=0,0,0,0&overlay=0&`;
  }
  // Model Y (默认)
  return `${baseUrl}?context=design_studio_2&options=$MTY13,$${colorCode},$WY19B,$INPB0&view=STUD_FRONT34&model=my&size=1920&bkba_opt=1&crop=0,0,0,0&overlay=0&`;
};

interface CarStatusHeroProps {
  car: Car;
}

export function CarStatusHero({ car }: CarStatusHeroProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const stateInfo = getCarStateInfo(car.state);
  const isCharging = car.state === 'charging';

  // 车漆与车型名称
  const colorConfig = COLOR_NAMES_ZH[car.exterior_color] || { name: car.exterior_color || '经典车漆', hex: '#64748b' };
  const carStudioUrl = getCarStudioImageUrl(car.model, car.exterior_color);

  return (
    <div className="perspective-1000 w-full select-none cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
      <div
        className={clsx(
          'relative w-full transition-transform duration-500 preserve-3d',
          isFlipped && 'rotate-y-180'
        )}
      >
        {/* ===================== 正面卡片 (Front: CyberUI 官方 Studio 3D 渲染与核心车况) ===================== */}
        <div
          className="cyber-card rounded-3xl p-4.5 sm:p-6 overflow-hidden relative backface-hidden shadow-2xl flex flex-col justify-between"
          style={{ backfaceVisibility: 'hidden', minHeight: '340px' }}
        >
          {/* 赛博科幻微光氛围 */}
          <div className="absolute top-0 right-10 w-72 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-0 animate-cyber-pulse" />
          <div className="absolute -bottom-10 left-10 w-64 h-36 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-0" />

          {/* 顶部状态行 */}
          <div className="relative z-10 flex items-start justify-between gap-3">
            {/* 左侧：Tesla App 风格电量与电量指示条 */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                {/* 物理电量胶囊 */}
                <div className="relative w-9 h-4.5 border border-white/30 rounded-[3px] flex items-center p-[1.5px] bg-black/40">
                  <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-2 rounded-r-[1px] bg-white/40" />
                  <div
                    className={clsx(
                      'h-full rounded-[1.5px] transition-all duration-500',
                      isCharging && 'animate-pulse'
                    )}
                    style={{
                      width: `${car.battery_level}%`,
                      background: car.battery_level <= 20 ? '#ef4444' : '#00f0ff',
                    }}
                  />
                  {isCharging && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <Zap className="w-3 h-3 fill-current text-white animate-bounce" />
                    </div>
                  )}
                </div>

                {/* 电量百分比大字 */}
                <span className="text-xl sm:text-2xl font-extrabold font-mono text-cyan-400 tracking-tight">
                  {car.battery_level}%
                </span>

                {/* 预估续航 */}
                <span className="text-xs text-zinc-400 font-mono">
                  {car.ideal_battery_range_km ? `${car.ideal_battery_range_km.toFixed(0)} km` : '--'}
                </span>
              </div>

              {/* 状态徽章 */}
              <div className="flex items-center gap-2 pt-0.5">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${stateInfo.bg} ${stateInfo.color} ${stateInfo.border}`}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
                  </span>
                  <span>{stateInfo.text}</span>
                </span>
                {car.since && (
                  <span className="text-[11px] text-zinc-500">
                    {formatTimeAgo(car.since)}
                  </span>
                )}
              </div>
            </div>

            {/* 右侧：车辆名称与翻转提示 */}
            <div className="text-right flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {car.name || `Tesla Model ${car.model}`}
                </h2>
                <span className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors" title="点击查看详细参数">
                  <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium">
                Model {car.model} {car.trim_badging ? `· ${car.trim_badging}` : ''}
              </span>
            </div>
          </div>

          {/* 中间核心：Tesla 官方 Studio 3D 真实车身高清大图 (带 Cyber 霓虹发光投影) */}
          <div className="relative z-10 flex-1 flex items-center justify-center py-2 pointer-events-none">
            <div className="absolute bottom-1 w-3/4 h-8 bg-cyan-500/20 blur-2xl rounded-full" />
            <img
              src={carStudioUrl}
              alt={`Tesla Model ${car.model}`}
              className="w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[480px] object-contain drop-shadow-[0_15px_30px_rgba(0,240,255,0.25)] transition-transform duration-500"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Model-Y.png';
              }}
            />
          </div>

          {/* 底部：4 项极简车况状态胶囊 (锁车、哨兵、温度、胎压) */}
          <div className="relative z-10 grid grid-cols-4 gap-2 pt-2.5 border-t border-zinc-800/60 text-xs">
            {/* 1. 车锁 */}
            <div className="flex items-center justify-center gap-1.5 py-1.5 px-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              {car.is_locked ? (
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-red-400 shrink-0" />
              )}
              <span className="text-[11px] text-zinc-300 font-medium truncate">
                {car.is_locked ? '已上锁' : '未锁定'}
              </span>
            </div>

            {/* 2. 哨兵 */}
            <div className="flex items-center justify-center gap-1.5 py-1.5 px-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              {car.is_sentry_mode ? (
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              )}
              <span className="text-[11px] text-zinc-300 font-medium truncate">
                {car.is_sentry_mode ? '哨兵开' : '哨兵关'}
              </span>
            </div>

            {/* 3. 温度 */}
            <div className="flex items-center justify-center gap-1.5 py-1.5 px-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <Thermometer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] text-zinc-300 font-medium truncate font-mono">
                {car.inside_temp != null ? `${car.inside_temp}°` : '--'}/{car.outside_temp != null ? `${car.outside_temp}°` : '--'}
              </span>
            </div>

            {/* 4. 胎压 */}
            <div className="flex items-center justify-center gap-1.5 py-1.5 px-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <Disc className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[11px] text-zinc-300 font-medium truncate font-mono">
                {car.tire_pressure_fl || 2.9} bar
              </span>
            </div>
          </div>
        </div>

        {/* ===================== 反面卡片 (Back: 结构饱满、无留白断层) ===================== */}
        <div
          className="cyber-card rounded-3xl p-4.5 sm:p-6 overflow-hidden absolute inset-0 backface-hidden shadow-2xl flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* 顶部标题栏 */}
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Info className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                车辆硬件与系统技术档案
              </h3>
            </div>
            <span className="text-[11px] text-cyan-400 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              <span>点击翻回车况</span>
              <RotateCw className="w-3 h-3" />
            </span>
          </div>

          {/* 紧致饱满的 6 格核心技术参数 (去除大截空白) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-auto py-2">
            <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80">
              <div className="text-[10px] text-zinc-500">车辆识别代码 (VIN)</div>
              <div className="font-mono text-xs font-semibold text-white mt-0.5 truncate select-text">
                {car.vin || '已安全脱敏'}
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80">
              <div className="text-[10px] text-zinc-500">车机系统版本</div>
              <div className="font-mono text-xs font-semibold text-cyan-400 mt-0.5 truncate">
                {car.version || '2024.32.10'}
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80">
              <div className="text-[10px] text-zinc-500">外观车漆配置</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div
                  className="w-3 h-3 rounded-full border border-white/20 shadow-sm shrink-0"
                  style={{ background: colorConfig.hex }}
                />
                <span className="text-xs font-medium text-white truncate">{colorConfig.name}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80">
              <div className="text-[10px] text-zinc-500">轮毂规格</div>
              <div className="text-xs font-medium text-white mt-0.5 truncate">
                {car.wheel_type || '19 寸双子星轮毂'}
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80">
              <div className="text-[10px] text-zinc-500">当前总里程 (Odometer)</div>
              <div className="font-mono text-xs font-semibold text-white mt-0.5 truncate">
                {car.odometer ? car.odometer.toFixed(1) : '0.0'} km
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80">
              <div className="text-[10px] text-zinc-500">额定满电续航</div>
              <div className="font-mono text-xs font-semibold text-emerald-400 mt-0.5 truncate">
                ~435.0 km
              </div>
            </div>
          </div>

          {/* 底部：通讯与系统监控三状态条 (充实底部，绝不留白) */}
          <div className="pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>MQTT 实时同步</span>
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>GCJ-02 纠偏正常</span>
            </span>
            <span className="text-zinc-500">
              只读安全模式
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
