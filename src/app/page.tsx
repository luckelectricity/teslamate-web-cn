import { 
  fetchCars, 
  fetchDrives, 
  fetchCharges, 
  fetchLifetimeStats,
  fetchSocHistory,
  fetchStatesTimeline,
} from '@/lib/queries';
import { DashboardSwitcher } from '@/components/views/DashboardSwitcher';

export const dynamic = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'auto' : 'force-dynamic';

export default async function HomePage() {
  const [cars, drives, charges, stats, socHistory, statesTimeline] = await Promise.all([
    fetchCars(),
    fetchDrives(undefined, 10, 0),
    fetchCharges(undefined, 10, 0),
    fetchLifetimeStats(),
    fetchSocHistory(1, 24),
    fetchStatesTimeline(1, 24),
  ]);

  const primaryCar = cars[0];

  return (
    <DashboardSwitcher
      car={primaryCar}
      drives={drives}
      charges={charges}
      stats={stats}
      socHistory={socHistory}
      statesTimeline={statesTimeline}
    />
  );
}
