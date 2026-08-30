import React from 'react';
import {
  fetchLifetimeStats,
  fetchSavingsAnalysis,
  fetchEnergyBreakdown,
  fetchDrivingRecords,
} from '@/lib/queries';
import { StatsClientView } from '@/components/views/StatsClientView';

export const dynamic = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'auto' : 'force-dynamic';

export default async function StatsPage() {
  const [stats, savings, energy, records] = await Promise.all([
    fetchLifetimeStats(),
    fetchSavingsAnalysis(),
    fetchEnergyBreakdown(),
    fetchDrivingRecords(),
  ]);

  return (
    <StatsClientView
      stats={stats}
      savings={savings}
      energy={energy}
      records={records}
    />
  );
}
