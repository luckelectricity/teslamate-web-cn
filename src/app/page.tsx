import { fetchCars, fetchDrives, fetchCharges, fetchLifetimeStats } from '@/lib/queries';
import { DashboardSwitcher } from '@/components/views/DashboardSwitcher';

export const revalidate = 0;

export default async function HomePage() {
  const [cars, drives, charges, stats] = await Promise.all([
    fetchCars(),
    fetchDrives(undefined, 10, 0),
    fetchCharges(undefined, 10, 0),
    fetchLifetimeStats(),
  ]);

  const primaryCar = cars[0];

  return (
    <DashboardSwitcher
      car={primaryCar}
      drives={drives}
      charges={charges}
      stats={stats}
    />
  );
}
