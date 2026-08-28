import {
  Car,
  DriveSummary,
  DriveDetail,
  ChargeSummary,
  ParkingSummary,
  LifetimeStats,
  BatteryHealthInfo,
  MonthlyReport,
  FootprintDrivePath,
} from '@/types';

// 1. Mock 车辆基础信息
export const MOCK_CAR: Car = {
  id: 1,
  name: 'Tesla Model Y',
  model: 'Model Y',
  trim_badging: 'Long Range AWD',
  vin: '5YJ3E1EB8NF000000',
  exterior_color: 'SolidBlack',
  wheel_type: 'Induction 20"',
  usable_battery_level: 82,
  battery_level: 82,
  ideal_battery_range_km: 432.5,
  est_battery_range_km: 395.0,
  odometer: 12580.6,
  speed: 0,
  power: 0,
  state: 'online',
  since: new Date().toISOString(),
  inside_temp: 22.5,
  outside_temp: 26.0,
  is_climate_on: false,
  is_locked: true,
  is_sentry_mode: true,
  doors_open: false,
  windows_open: false,
  frunk_open: false,
  trunk_open: false,
  tire_pressure_fl: 2.9,
  tire_pressure_fr: 2.9,
  tire_pressure_rl: 2.9,
  tire_pressure_rr: 2.9,
  latitude: 34.223881,
  longitude: 108.825993,
  address: '高新区 · 软件新城 (天谷四路)',
  version: '2024.32.10',
  battery_heater: false,
};

// 2. 模拟高精度行车轨迹点 (Drive 51: 约 12.8km)
const generateMockPositions = (count: number = 80) => {
  const startLat = 34.2635;
  const startLng = 108.7792;
  const endLat = 34.2238;
  const endLng = 108.8259;
  const now = Date.now();

  return Array.from({ length: count }, (_, i) => {
    const ratio = i / (count - 1);
    const lat = startLat + (endLat - startLat) * ratio + Math.sin(ratio * Math.PI) * 0.008;
    const lng = startLng + (endLng - startLng) * ratio - Math.sin(ratio * Math.PI) * 0.005;
    const speed = Math.round(35 + Math.sin(ratio * Math.PI * 3) * 28 + (i % 5 === 0 ? -15 : 10));
    const power = Math.round(12 + Math.sin(ratio * Math.PI * 4) * 25);
    const elevation = Math.round(410 + Math.sin(ratio * Math.PI * 2) * 18);
    const battery = Math.max(76, Math.round(82 - ratio * 6));

    return {
      id: 1000 + i,
      date: new Date(now - (count - i) * 15 * 1000).toISOString(),
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      speed: Math.max(0, speed),
      power: power,
      battery_level: battery,
      odometer: Number((12568.6 + ratio * 12.0).toFixed(1)),
      elevation: elevation,
      inside_temp: 22.5,
      outside_temp: 26.0,
    };
  });
};

const mockPositions = generateMockPositions(80);

// 3. Mock 单次行程详情 (DriveDetail)
export const MOCK_DRIVE_DETAIL: DriveDetail = {
  id: 51,
  car_id: 1,
  start_date: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  end_date: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  duration_min: 30,
  distance: 12.8,
  speed_max: 78,
  speed_avg: 42.6,
  power_max: 68,
  power_min: -24,
  start_address: '西咸新区 · 沣东新城 (家)',
  end_address: '高新区 · 软件新城 (天谷四路)',
  start_battery_level: 82,
  end_battery_level: 76,
  consumption_kwh: 1.82,
  efficiency_wh_km: 142,
  ascent: 24,
  descent: 18,
  outside_temp_avg: 26.0,
  positions: mockPositions,
};

// 4. Mock 行程列表 (Drives)
export const MOCK_DRIVES: DriveSummary[] = [
  {
    id: 51,
    car_id: 1,
    start_date: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    duration_min: 30,
    distance: 12.8,
    speed_max: 78,
    speed_avg: 42.6,
    power_max: 68,
    power_min: -24,
    start_address: '西咸新区 · 沣东新城 (家)',
    end_address: '高新区 · 软件新城 (天谷四路)',
    start_battery_level: 82,
    end_battery_level: 76,
    consumption_kwh: 1.82,
    efficiency_wh_km: 142,
    ascent: 24,
    descent: 18,
    outside_temp_avg: 26.0,
  },
  {
    id: 50,
    car_id: 1,
    start_date: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
    end_date: new Date(Date.now() - 8.5 * 3600 * 1000).toISOString(),
    duration_min: 32,
    distance: 13.1,
    speed_max: 82,
    speed_avg: 39.5,
    power_max: 75,
    power_min: -28,
    start_address: '高新区 · 软件新城',
    end_address: '西咸新区 · 沣东新城',
    start_battery_level: 88,
    end_battery_level: 82,
    consumption_kwh: 1.95,
    efficiency_wh_km: 148,
    ascent: 18,
    descent: 24,
    outside_temp_avg: 28.5,
  },
  {
    id: 49,
    car_id: 1,
    start_date: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    end_date: new Date(Date.now() - 25.2 * 3600 * 1000).toISOString(),
    duration_min: 48,
    distance: 28.5,
    speed_max: 105,
    speed_avg: 62.0,
    power_max: 110,
    power_min: -35,
    start_address: '西咸新区 · 沣东新城',
    end_address: '曲江新区 · 大唐不夜城',
    start_battery_level: 95,
    end_battery_level: 86,
    consumption_kwh: 4.25,
    efficiency_wh_km: 149,
    ascent: 35,
    descent: 32,
    outside_temp_avg: 25.0,
  },
  {
    id: 48,
    car_id: 1,
    start_date: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
    end_date: new Date(Date.now() - 31.4 * 3600 * 1000).toISOString(),
    duration_min: 36,
    distance: 18.2,
    speed_max: 92,
    speed_avg: 48.2,
    power_max: 88,
    power_min: -20,
    start_address: '曲江新区 · 大唐不夜城',
    end_address: '未央区 · 钟楼商圈',
    start_battery_level: 86,
    end_battery_level: 80,
    consumption_kwh: 2.65,
    efficiency_wh_km: 145,
    ascent: 15,
    descent: 20,
    outside_temp_avg: 27.0,
  },
];

// 5. Mock 全景足迹大地图数据 (FootprintDrives)
export const MOCK_FOOTPRINT_DRIVES: FootprintDrivePath[] = [
  {
    id: 51,
    start_date: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    distance: 12.8,
    duration_min: 30,
    start_address: '西咸新区 · 沣东新城',
    end_address: '高新区 · 软件新城',
    points: generateMockPositions(60).map((p) => [p.latitude, p.longitude]),
  },
  {
    id: 50,
    start_date: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
    distance: 13.1,
    duration_min: 32,
    start_address: '高新区 · 软件新城',
    end_address: '西咸新区 · 沣东新城',
    points: generateMockPositions(50).reverse().map((p) => [p.latitude, p.longitude]),
  },
  {
    id: 49,
    start_date: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    distance: 28.5,
    duration_min: 48,
    start_address: '西咸新区 · 沣东新城',
    end_address: '曲江新区 · 大唐不夜城',
    points: Array.from({ length: 70 }, (_, i) => {
      const ratio = i / 69;
      const lat = 34.2635 + (34.1950 - 34.2635) * ratio;
      const lng = 108.7792 + (108.9650 - 108.7792) * ratio;
      return [Number(lat.toFixed(6)), Number(lng.toFixed(6))] as [number, number];
    }),
  },
];

// 6. Mock 充电记录 (Charges)
export const MOCK_CHARGES: ChargeSummary[] = [
  {
    id: 201,
    car_id: 1,
    start_date: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    end_date: new Date(Date.now() - 44 * 3600 * 1000).toISOString(),
    duration_min: 240,
    charge_energy_added: 28.5,
    charge_energy_used: 30.2,
    cost: 9.39,
    start_battery_level: 45,
    end_battery_level: 82,
    start_ideal_range_km: 235.0,
    end_ideal_range_km: 432.5,
    address: '家 (沣东新城交流桩 7kW)',
    charger_type: '7kW 交流慢充 (谷电)',
  },
  {
    id: 200,
    car_id: 1,
    start_date: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    end_date: new Date(Date.now() - 119.5 * 3600 * 1000).toISOString(),
    duration_min: 35,
    charge_energy_added: 42.0,
    charge_energy_used: 44.5,
    cost: 58.6,
    start_battery_level: 20,
    end_battery_level: 80,
    start_ideal_range_km: 105.0,
    end_ideal_range_km: 420.0,
    address: '高新中大国际 Tesla V3 超充站',
    charger_type: '250kW Tesla V3 超级快充',
  },
];

// 7. Mock 停车记录 (Parking)
export const MOCK_PARKING: ParkingSummary[] = [
  {
    id: 301,
    car_id: 1,
    start_date: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    end_date: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    duration_min: 420,
    start_ideal_range_km: 435.0,
    end_ideal_range_km: 432.5,
    start_battery_level: 83,
    end_battery_level: 82,
    range_lost_km: 2.5,
    energy_lost_kwh: 0.38,
    drain_rate_kwh_per_hour: 0.054,
    address: '软件新城地下停车场 (哨兵开启)',
    is_home: false,
    has_charge: false,
  },
  {
    id: 300,
    car_id: 1,
    start_date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    end_date: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    duration_min: 600,
    start_ideal_range_km: 440.0,
    end_ideal_range_km: 435.0,
    start_battery_level: 84,
    end_battery_level: 83,
    range_lost_km: 5.0,
    energy_lost_kwh: 0.77,
    drain_rate_kwh_per_hour: 0.077,
    address: '家 (地库)',
    is_home: true,
    has_charge: false,
  },
];

// 8. Mock 终身统计 (Lifetime Stats)
export const MOCK_LIFETIME_STATS: LifetimeStats = {
  total_drives: 386,
  total_distance_km: 12580.6,
  total_drive_duration_hours: 312.5,
  total_energy_kwh: 1824.5,
  avg_efficiency_wh_km: 145,
  total_charges: 68,
  total_charge_energy_added: 2150.0,
  total_charge_cost: 628.5,
  sentry_duration_hours: 480,
  sleep_duration_hours: 1200.0,
};

// 9. Mock 月度账单 (Monthly Reports)
export const MOCK_MONTHLY_REPORTS: MonthlyReport[] = [
  {
    month: '2026-08',
    drive_count: 52,
    distance_km: 1280.5,
    drive_kwh: 185.6,
    avg_wh_km: 145,
    charge_count: 8,
    charge_energy_kwh: 210.0,
    charge_cost: 57.7,
    fuel_equivalent_cost: 819,
    saved_cost: 761,
  },
  {
    month: '2026-07',
    drive_count: 60,
    distance_km: 1450.2,
    drive_kwh: 215.0,
    avg_wh_km: 148,
    charge_count: 10,
    charge_energy_kwh: 240.0,
    charge_cost: 66.8,
    fuel_equivalent_cost: 928,
    saved_cost: 861,
  },
  {
    month: '2026-06',
    drive_count: 46,
    distance_km: 1120.0,
    drive_kwh: 160.2,
    avg_wh_km: 143,
    charge_count: 7,
    charge_energy_kwh: 180.0,
    charge_cost: 49.8,
    fuel_equivalent_cost: 716,
    saved_cost: 666,
  },
];

// 10. Mock 电池健康信息
export const MOCK_BATTERY_HEALTH: BatteryHealthInfo = {
  nominal_full_pack_kwh: 60.0,
  current_usable_pack_kwh: 59.1,
  health_percent: 98.5,
  estimated_full_range_km: 432.5,
  original_full_range_km: 440.0,
  degradation_percent: 1.5,
  slow_charge_count: 58,
  fast_charge_count: 10,
  slow_charge_percent: 85.3,
  cycle_count: 35.8,
};
