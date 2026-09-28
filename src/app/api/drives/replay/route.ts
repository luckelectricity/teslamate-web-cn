import { NextRequest, NextResponse } from 'next/server';
import { fetchReplayDrives } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get('days');
    const carIdParam = searchParams.get('carId');

    const days = daysParam ? parseInt(daysParam, 10) : 7;
    const carId = carIdParam ? parseInt(carIdParam, 10) : undefined;

    const safeDays = isNaN(days) ? 7 : Math.min(30, Math.max(1, days));

    const drives = await fetchReplayDrives(carId, safeDays);

    return NextResponse.json({
      success: true,
      days: safeDays,
      total_drives: drives.length,
      drives,
    });
  } catch (error: any) {
    console.error('API /api/drives/replay error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '获取回放行程数据失败' },
      { status: 500 }
    );
  }
}
