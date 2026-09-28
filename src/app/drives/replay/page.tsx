import React from 'react';
import { fetchReplayDrives } from '@/lib/queries';
import { Trip3DReplayModal } from '@/components/replay/Trip3DReplayModal';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TripReplayPage() {
  const initialDrives = await fetchReplayDrives(undefined, 7);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <Trip3DReplayModal
        isOpen={true}
        onClose={() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/drives';
          }
        }}
        initialDays={7}
        initialDrives={initialDrives}
      />
    </div>
  );
}
