'use client';

import React from 'react';
import { useViewModeStore } from '@/store/useViewModeStore';
import { MobileDashboard } from './MobileDashboard';
import { DesktopDashboard } from './DesktopDashboard';
import { Car, DriveSummary, ChargeSummary, LifetimeStats } from '@/types';

interface DashboardSwitcherProps {
  car: Car;
  drives: DriveSummary[];
  charges: ChargeSummary[];
  stats: LifetimeStats;
}

export function DashboardSwitcher({ car, drives, charges, stats }: DashboardSwitcherProps) {
  const { isMobileLayout, mode } = useViewModeStore();

  // 当为 mobile 模式或屏幕宽度小于 lg 且未强制 desktop 时，显示移动端流式卡片
  const showMobile = mode === 'mobile' || (mode === 'auto' && isMobileLayout);

  if (showMobile) {
    return (
      <MobileDashboard
        car={car}
        latestDrive={drives[0]}
        latestCharge={charges[0]}
        stats={stats}
      />
    );
  }

  return (
    <DesktopDashboard
      car={car}
      drives={drives}
      charges={charges}
      stats={stats}
    />
  );
}
