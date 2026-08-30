import React from 'react';
import { fetchParkings, fetchEnergyBreakdown } from '@/lib/queries';
import { ParkingSwitcher } from '@/components/views/ParkingSwitcher';

export const dynamic = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'auto' : 'force-dynamic';

export default async function ParkingPage() {
  const [parkings, energy] = await Promise.all([
    fetchParkings(undefined, 50, 0),
    fetchEnergyBreakdown(),
  ]);

  return <ParkingSwitcher parkings={parkings} energy={energy} />;
}
