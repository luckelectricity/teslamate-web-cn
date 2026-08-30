import { fetchDrives } from '@/lib/queries';
import { DrivesSwitcher } from '@/components/views/DrivesSwitcher';

export const dynamic = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'auto' : 'force-dynamic';

export default async function DrivesPage() {
  const drives = await fetchDrives(undefined, 50, 0);

  return <DrivesSwitcher drives={drives} />;
}
