'use client';

import React from 'react';
import { useViewModeStore } from '@/store/useViewModeStore';
import { ParkingSummary, EnergyBreakdown } from '@/types';
import { MobileParkingView } from './MobileParkingView';
import { DesktopParkingView } from './DesktopParkingView';

interface ParkingSwitcherProps {
  parkings: ParkingSummary[];
  energy: EnergyBreakdown;
}

export function ParkingSwitcher({ parkings, energy }: ParkingSwitcherProps) {
  const { isMobileLayout, mode } = useViewModeStore();
  const showMobile = mode === 'mobile' || (mode === 'auto' && isMobileLayout);

  if (showMobile) {
    return <MobileParkingView parkings={parkings} energy={energy} />;
  }

  return <DesktopParkingView parkings={parkings} energy={energy} />;
}
