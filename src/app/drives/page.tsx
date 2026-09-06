import { fetchDrives } from '@/lib/queries';
import { DrivesSwitcher } from '@/components/views/DrivesSwitcher';

export const dynamic = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'auto' : 'force-dynamic';

export default async function DrivesPage() {
  const drives = await fetchDrives(undefined, 200, 0, true);

  return <DrivesSwitcher drives={drives} />;
}
