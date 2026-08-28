import { fetchCharges } from '@/lib/queries';
import { ChargesSwitcher } from '@/components/views/ChargesSwitcher';

export const revalidate = 0;

export default async function ChargesPage() {
  const charges = await fetchCharges(undefined, 50, 0);

  return <ChargesSwitcher charges={charges} />;
}
