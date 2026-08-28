'use client';

import React from 'react';
import { useViewModeStore } from '@/store/useViewModeStore';
import { MobileDrivesView } from './MobileDrivesView';
import { DesktopDrivesView } from './DesktopDrivesView';
import { DriveSummary } from '@/types';

interface DrivesSwitcherProps {
  drives: DriveSummary[];
}

export function DrivesSwitcher({ drives }: DrivesSwitcherProps) {
  const { isMobileLayout, mode } = useViewModeStore();
  const showMobile = mode === 'mobile' || (mode === 'auto' && isMobileLayout);

  if (showMobile) {
    return <MobileDrivesView drives={drives} />;
  }

  return <DesktopDrivesView drives={drives} />;
}
