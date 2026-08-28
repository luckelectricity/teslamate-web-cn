'use client';

import React from 'react';
import { useViewModeStore } from '@/store/useViewModeStore';
import { MobileChargesView } from './MobileChargesView';
import { DesktopChargesView } from './DesktopChargesView';
import { ChargeSummary } from '@/types';

interface ChargesSwitcherProps {
  charges: ChargeSummary[];
}

export function ChargesSwitcher({ charges }: ChargesSwitcherProps) {
  const { isMobileLayout, mode } = useViewModeStore();
  const showMobile = mode === 'mobile' || (mode === 'auto' && isMobileLayout);

  if (showMobile) {
    return <MobileChargesView charges={charges} />;
  }

  return <DesktopChargesView charges={charges} />;
}
