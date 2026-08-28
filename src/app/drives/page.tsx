import { fetchDrives } from '@/lib/queries';
import { DrivesSwitcher } from '@/components/views/DrivesSwitcher';

export const revalidate = 0;

export default async function DrivesPage() {
  const drives = await fetchDrives(undefined, 50, 0);

  return <DrivesSwitcher drives={drives} />;
}
