import React from 'react';
import { fetchVisitedLocations, fetchDrives, fetchFootprintDrives } from '@/lib/queries';
import { FootprintAnalysisClientView } from '@/components/views/FootprintAnalysisClientView';

export const dynamic = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'auto' : 'force-dynamic';

export default async function FootprintPage() {
  const [locations, drives, paths] = await Promise.all([
    fetchVisitedLocations(),
    fetchDrives(undefined, 200, 0, true),
    fetchFootprintDrives(),
  ]);

  return (
    <FootprintAnalysisClientView
      locations={locations}
      drives={drives}
      paths={paths}
    />
  );
}
