import React from 'react';
import { fetchMonthlyReports } from '@/lib/queries';
import { MonthlyReportClient } from '@/components/views/MonthlyReportClient';

export const revalidate = 0;

export default async function MonthlyReportsPage() {
  const reports = await fetchMonthlyReports();

  return <MonthlyReportClient reports={reports} />;
}
