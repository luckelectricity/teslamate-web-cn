import React from 'react';
import { notFound } from 'next/navigation';
import { fetchDriveDetail } from '@/lib/queries';
import { DriveDetailClient } from '@/components/views/DriveDetailClient';

export const dynamic = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'auto' : 'force-dynamic';

interface DriveDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateStaticParams() {
  return [{ id: '51' }, { id: '50' }, { id: '49' }, { id: '48' }];
}

export default async function DriveDetailPage({ params }: DriveDetailPageProps) {
  const driveId = parseInt(params.id, 10);
  if (isNaN(driveId)) notFound();

  const drive = await fetchDriveDetail(driveId);
  if (!drive) notFound();

  return <DriveDetailClient drive={drive} />;
}
