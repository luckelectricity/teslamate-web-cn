import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const carId = Number(body.car_id || 1);
    const deliveryDate = String(body.delivery_date || '').trim();

    if (!deliveryDate || !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
      return NextResponse.json(
        { success: false, error: '无效的日期格式，请使用 YYYY-MM-DD 格式' },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    if (!pool) {
      return NextResponse.json({ success: true, car_id: carId, delivery_date: deliveryDate });
    }

    // 确保 car_metadata 表存在并写入
    await pool.query(`
      CREATE TABLE IF NOT EXISTS car_metadata (
        car_id integer PRIMARY KEY REFERENCES cars(id) ON DELETE CASCADE,
        delivery_date date NOT NULL DEFAULT '2026-08-16',
        created_at timestamp without time zone DEFAULT NOW(),
        updated_at timestamp without time zone DEFAULT NOW()
      );
    `);

    await pool.query(`
      INSERT INTO car_metadata (car_id, delivery_date, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (car_id) 
      DO UPDATE SET delivery_date = EXCLUDED.delivery_date, updated_at = NOW();
    `, [carId, deliveryDate]);

    return NextResponse.json({
      success: true,
      car_id: carId,
      delivery_date: deliveryDate,
      message: '提车日期已成功保存并同步！',
    });
  } catch (err: any) {
    console.error('Save delivery date error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || '保存失败' },
      { status: 500 }
    );
  }
}
