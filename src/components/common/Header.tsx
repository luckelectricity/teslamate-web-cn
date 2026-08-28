'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car } from '@/types';
import { useCarStore } from '@/store/useCarStore';
import { getCarStateInfo } from '@/lib/formatters';
import { BatteryCharging, ChevronDown, RefreshCw } from 'lucide-react';

interface HeaderProps {
  cars: Car[];
}

const desktopNavItems = [
  { name: '总览', href: '/' },
  { name: '行程轨迹', href: '/drives' },
  { name: '停车漏电', href: '/parking' },
  { name: '充电能耗', href: '/charges' },
  { name: '统计大盘', href: '/stats' },
];

export function Header({ cars }: HeaderProps) {
  const pathname = usePathname();
  const { selectedCarId, setSelectedCarId } = useCarStore();
  const activeCar = cars.find((c) => c.id === selectedCarId) || cars[0];

  const stateInfo = getCarStateInfo(activeCar?.state);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* 左侧：Logo & 车辆选择器 */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white shadow-md shadow-red-600/30">
              <span className="text-base tracking-tighter">T</span>
            </div>
            <span className="font-bold text-base text-white hidden sm:inline tracking-tight">
              TeslaMate <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">CN</span>
            </span>
          </Link>

          {/* 桌面端导航菜单 */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {desktopNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* 车辆下拉选择 */}
          {cars.length > 0 && (
            <div className="relative ml-1">
              <select
                value={selectedCarId || cars[0]?.id}
                onChange={(e) => setSelectedCarId(Number(e.target.value))}
                className="appearance-none bg-zinc-900 text-xs text-zinc-200 font-medium pl-3 pr-7 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
              >
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name || `${car.model}`}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>
          )}
        </div>

        {/* 右侧：实时车辆状态指标 */}
        {activeCar && (
          <div className="flex items-center gap-2.5">
            {/* 状态胶囊 */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${stateInfo.bg} ${stateInfo.color} ${stateInfo.border}`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span>{stateInfo.text}</span>
            </div>

            {/* 电池与估算续航 */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-300 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800">
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-white">{activeCar.battery_level}%</span>
              <span className="text-zinc-500">|</span>
              <span>{activeCar.ideal_battery_range_km} km</span>
            </div>

            {/* 刷新状态 */}
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              title="刷新最新数据"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
