import React from 'react';
import { fetchLifetimeStats, fetchSavingsAnalysis, fetchEnergyBreakdown } from '@/lib/queries';
import { StatsClientView } from '@/components/views/StatsClientView';

export const revalidate = 0;

export default async function StatsPage() {
  const [stats, savings, energy] = await Promise.all([
    fetchLifetimeStats(),
    fetchSavingsAnalysis(),
    fetchEnergyBreakdown(),
  ]);

  return <StatsClientView stats={stats} savings={savings} energy={energy} />;
}
