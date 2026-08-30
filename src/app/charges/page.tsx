import { fetchCharges } from '@/lib/queries';
import { ChargesSwitcher } from '@/components/views/ChargesSwitcher';

export const dynamic = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'auto' : 'force-dynamic';

export default async function ChargesPage() {
  const charges = await fetchCharges(undefined, 50, 0);

  return <ChargesSwitcher charges={charges} />;
}
