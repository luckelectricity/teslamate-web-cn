import React from 'react';
import { fetchParkings, fetchEnergyBreakdown } from '@/lib/queries';
import { ParkingSwitcher } from '@/components/views/ParkingSwitcher';

export default async function ParkingPage() {
  const [parkings, energy] = await Promise.all([
    fetchParkings(undefined, 50, 0),
    fetchEnergyBreakdown(),
  ]);

  return <ParkingSwitcher parkings={parkings} energy={energy} />;
}
