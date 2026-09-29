'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Trip3DReplayModal } from '@/components/replay/Trip3DReplayModal';

export default function TripReplayPage() {
  const router = useRouter();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <Trip3DReplayModal
        isOpen={true}
        onClose={() => router.push('/drives')}
        initialDays={7}
      />
    </div>
  );
}
