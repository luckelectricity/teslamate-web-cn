import React from 'react';
import { fetchMonthlyReports } from '@/lib/queries';
import { MonthlyReportClient } from '@/components/views/MonthlyReportClient';

export const dynamic = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'auto' : 'force-dynamic';

export default async function MonthlyReportsPage() {
  const reports = await fetchMonthlyReports();

  return <MonthlyReportClient reports={reports} />;
}
