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
  PositionPoint,
} from '@/types';

// ==========================================
// 🛠️ 高保真多拐点真实道路轨迹生成算法
// ==========================================
interface Waypoint {
  lat: number;
  lng: number;
  targetSpeed: number;
  elevation: number;
}

function generateRoutePositions(
  waypoints: Waypoint[],
  totalPoints: number,
  startOdo: number,
  totalDistKm: number,
  startBattery: number,
  endBattery: number
): PositionPoint[] {
  const result: PositionPoint[] = [];
  const segmentCount = waypoints.length - 1;
  const ptsPerSegment = Math.floor(totalPoints / segmentCount);
  const now = Date.now();

  let globalIdx = 0;

  for (let s = 0; s < segmentCount; s++) {
    const wp1 = waypoints[s];
    const wp2 = waypoints[s + 1];
    const count = s === segmentCount - 1 ? totalPoints - globalIdx : ptsPerSegment;

    for (let i = 0; i < count; i++) {
      const t = i / count;
      // 沿途微小自然曲线晃动
      const curveLat = Math.sin(t * Math.PI) * 0.0003;
      const curveLng = Math.cos(t * Math.PI) * 0.0002;

      const lat = wp1.lat + (wp2.lat - wp1.lat) * t + curveLat;
      const lng = wp1.lng + (wp2.lng - wp1.lng) * t + curveLng;

      // 速度过渡 + 拟真红绿灯/加减速微调
      const baseSpeed = wp1.targetSpeed + (wp2.targetSpeed - wp1.targetSpeed) * t;
      const speedJitter = Math.sin(t * Math.PI * 4) * 8 + (globalIdx % 7 === 0 ? -12 : 5);
      const speed = Math.max(0, Math.min(120, Math.round(baseSpeed + speedJitter)));

      // 动力功率：加速 > 0，减速动能回收 < 0
      let power = 15;
      if (speedJitter > 2) {
        power = Math.round(25 + speedJitter * 3.5);
      } else if (speedJitter < -5) {
        power = Math.round(-18 + speedJitter * 1.5); // 动能回收
      } else {
        power = Math.round(12 + (speed / 100) * 15);
      }

      const elev = Math.round(wp1.elevation + (wp2.elevation - wp1.elevation) * t + Math.sin(t * Math.PI * 2) * 2);
      const progress = globalIdx / (totalPoints - 1);
      const battery = Number((startBattery - progress * (startBattery - endBattery)).toFixed(0));
      const odo = Number((startOdo + progress * totalDistKm).toFixed(2));

      result.push({
        id: 1000 + globalIdx,
        date: new Date(now - (totalPoints - globalIdx) * 15 * 1000).toISOString(),
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
        speed,
        power,
        battery_level: battery,
        odometer: odo,
        elevation: elev,
        inside_temp: 22.0,
        outside_temp: 25.5,
      });

      globalIdx++;
    }
  }

  return result;
}

// -------------------------------------------------------------
// 路线 1 拐点：西安钟楼 ➔ 南门 ➔ 南稍门 ➔ 小寨 ➔ 大雁塔北广场 (8.6 km)
// -------------------------------------------------------------
const route1Waypoints: Waypoint[] = [
  { lat: 34.25944, lng: 108.94703, targetSpeed: 0, elevation: 412 },  // 钟楼盘道
  { lat: 34.25102, lng: 108.94715, targetSpeed: 45, elevation: 414 }, // 南门永宁门
  { lat: 34.24150, lng: 108.94720, targetSpeed: 52, elevation: 417 }, // 南稍门中轴线
  { lat: 34.23200, lng: 108.94725, targetSpeed: 48, elevation: 420 }, // 草场坡/省体
  { lat: 34.22560, lng: 108.94725, targetSpeed: 35, elevation: 423 }, // 小寨十字
  { lat: 34.22300, lng: 108.95500, targetSpeed: 42, elevation: 425 }, // 小寨东路
  { lat: 34.22020, lng: 108.96420, targetSpeed: 0, elevation: 428 },  // 大雁塔北广场
];

// -------------------------------------------------------------
// 路线 2 拐点：西安北站 ➔ 文景路 ➔ 汉城湖 ➔ 钟楼 (16.8 km)
// -------------------------------------------------------------
const route2Waypoints: Waypoint[] = [
  { lat: 34.37520, lng: 108.93880, targetSpeed: 0, elevation: 388 },  // 西安北站南广场
  { lat: 34.33550, lng: 108.93200, targetSpeed: 65, elevation: 395 }, // 经开区文景路
  { lat: 34.30500, lng: 108.90500, targetSpeed: 58, elevation: 401 }, // 汉城湖遗址公园
  { lat: 34.28500, lng: 108.94700, targetSpeed: 45, elevation: 408 }, // 北关正街/北大街
  { lat: 34.25944, lng: 108.94703, targetSpeed: 0, elevation: 412 },  // 钟楼
];

// -------------------------------------------------------------
// 路线 3 拐点：秦始皇帝陵博物院(兵马俑) ➔ 连霍高速 ➔ 大唐不夜城 (38.5 km)
// -------------------------------------------------------------
const route3Waypoints: Waypoint[] = [
  { lat: 34.38420, lng: 109.27850, targetSpeed: 30, elevation: 512 }, // 兵马俑景区
  { lat: 34.37200, lng: 109.21500, targetSpeed: 85, elevation: 480 }, // 临潼收费站
  { lat: 34.32500, lng: 109.12000, targetSpeed: 110, elevation: 435 },// G30 连霍高速巡航
  { lat: 34.27500, lng: 109.02500, targetSpeed: 105, elevation: 420 },// 东三环快速路
  { lat: 34.21200, lng: 108.96500, targetSpeed: 0, elevation: 430 },  // 大唐不夜城开元广场
];

// -------------------------------------------------------------
// 路线 4 拐点：大唐不夜城 ➔ 曲江池 ➔ 陕西历史博物馆 (6.5 km)
// -------------------------------------------------------------
const route4Waypoints: Waypoint[] = [
  { lat: 34.21200, lng: 108.96500, targetSpeed: 0, elevation: 430 },  // 大唐不夜城
  { lat: 34.19800, lng: 108.97200, targetSpeed: 40, elevation: 425 }, // 曲江池遗址公园
  { lat: 34.20800, lng: 108.95800, targetSpeed: 45, elevation: 426 }, // 雁塔南路
  { lat: 34.22350, lng: 108.95150, targetSpeed: 0, elevation: 425 },  // 陕西历史博物馆
];

const mockPositionsDrive51 = generateRoutePositions(route1Waypoints, 100, 15280.2, 8.6, 82, 78);
const mockPositionsDrive50 = generateRoutePositions(route2Waypoints, 75, 15263.4, 16.8, 89, 82);
const mockPositionsDrive49 = generateRoutePositions(route3Waypoints, 90, 15224.9, 38.5, 96, 89);
const mockPositionsDrive48 = generateRoutePositions(route4Waypoints, 60, 15218.4, 6.5, 98, 96);

// ==========================================
// 1. Mock 车辆基础信息
// ==========================================
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
  odometer: 15288.8,
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
  latitude: 34.22020,
  longitude: 108.96420,
  address: '雁塔区 · 大雁塔北广场 (慈恩路)',
  version: '2024.32.10',
  battery_heater: false,
};

// ==========================================
// 2. Mock 单次行程详情 (DriveDetail - 主演示行程)
// ==========================================
export const MOCK_DRIVE_DETAIL: DriveDetail = {
  id: 51,
  car_id: 1,
  start_date: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  end_date: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  duration_min: 25,
  distance: 8.6,
  speed_max: 68,
  speed_avg: 36.8,
  power_max: 65,
  power_min: -26,
  start_address: '碑林区 · 西安钟楼商圈 (东大街)',
  end_address: '雁塔区 · 大雁塔北广场 (慈恩路)',
  start_battery_level: 82,
  end_battery_level: 78,
  consumption_kwh: 1.25,
  efficiency_wh_km: 145,
  ascent: 18,
  descent: 6,
  outside_temp_avg: 25.5,
  positions: mockPositionsDrive51,
};

// ==========================================
// 3. Mock 行程列表 (Drives)
// ==========================================
export const MOCK_DRIVES: DriveSummary[] = [
  {
    id: 51,
    car_id: 1,
    start_date: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    duration_min: 25,
    distance: 8.6,
    speed_max: 68,
    speed_avg: 36.8,
    power_max: 65,
    power_min: -26,
    start_address: '碑林区 · 西安钟楼商圈 (东大街)',
    end_address: '雁塔区 · 大雁塔北广场 (慈恩路)',
    start_battery_level: 82,
    end_battery_level: 78,
    consumption_kwh: 1.25,
    efficiency_wh_km: 145,
    ascent: 18,
    descent: 6,
    outside_temp_avg: 25.5,
  },
  {
    id: 50,
    car_id: 1,
    start_date: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    end_date: new Date(Date.now() - 5.4 * 3600 * 1000).toISOString(),
    duration_min: 36,
    distance: 16.8,
    speed_max: 82,
    speed_avg: 44.5,
    power_max: 78,
    power_min: -30,
    start_address: '未央区 · 西安北站 (高铁站)',
    end_address: '碑林区 · 永宁门 (南门盘道)',
    start_battery_level: 89,
    end_battery_level: 82,
    consumption_kwh: 2.48,
    efficiency_wh_km: 147,
    ascent: 24,
    descent: 12,
    outside_temp_avg: 27.0,
  },
  {
    id: 49,
    car_id: 1,
    start_date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    end_date: new Date(Date.now() - 23.2 * 3600 * 1000).toISOString(),
    duration_min: 48,
    distance: 38.5,
    speed_max: 112,
    speed_avg: 68.2,
    power_max: 115,
    power_min: -38,
    start_address: '临潼区 · 秦始皇帝陵博物院 (兵马俑)',
    end_address: '雁塔区 · 大唐不夜城开元广场',
    start_battery_level: 96,
    end_battery_level: 89,
    consumption_kwh: 5.62,
    efficiency_wh_km: 146,
    ascent: 42,
    descent: 68,
    outside_temp_avg: 26.0,
  },
  {
    id: 48,
    car_id: 1,
    start_date: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    end_date: new Date(Date.now() - 29.6 * 3600 * 1000).toISOString(),
    duration_min: 22,
    distance: 6.5,
    speed_max: 62,
    speed_avg: 32.4,
    power_max: 58,
    power_min: -22,
    start_address: '雁塔区 · 大唐不夜城',
    end_address: '雁塔区 · 陕西历史博物馆',
    start_battery_level: 98,
    end_battery_level: 96,
    consumption_kwh: 0.94,
    efficiency_wh_km: 144,
    ascent: 12,
    descent: 8,
    outside_temp_avg: 24.5,
  },
];

// ==========================================
// 4. Mock 全景足迹大地图数据 (FootprintDrives)
// ==========================================
export const MOCK_FOOTPRINT_DRIVES: FootprintDrivePath[] = [
  {
    id: 51,
    start_date: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    distance: 8.6,
    duration_min: 25,
    start_address: '西安钟楼商圈',
    end_address: '大雁塔北广场',
    points: mockPositionsDrive51.map((p) => [p.latitude, p.longitude]),
  },
  {
    id: 50,
    start_date: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    distance: 16.8,
    duration_min: 36,
    start_address: '西安北站 (高铁站)',
    end_address: '永宁门 (南门)',
    points: mockPositionsDrive50.map((p) => [p.latitude, p.longitude]),
  },
  {
    id: 49,
    start_date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    distance: 38.5,
    duration_min: 48,
    start_address: '秦始皇帝陵博物院 (兵马俑)',
    end_address: '大唐不夜城开元广场',
    points: mockPositionsDrive49.map((p) => [p.latitude, p.longitude]),
  },
  {
    id: 48,
    start_date: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    distance: 6.5,
    duration_min: 22,
    start_address: '大唐不夜城',
    end_address: '陕西历史博物馆',
    points: mockPositionsDrive48.map((p) => [p.latitude, p.longitude]),
  },
];

// ==========================================
// 5. Mock 充电记录 (Charges)
// ==========================================
export const MOCK_CHARGES: ChargeSummary[] = [
  {
    id: 201,
    car_id: 1,
    start_date: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    end_date: new Date(Date.now() - 35.3 * 3600 * 1000).toISOString(),
    duration_min: 42,
    charge_energy_added: 45.2,
    charge_energy_used: 47.8,
    cost: 56.4,
    start_battery_level: 22,
    end_battery_level: 85,
    start_ideal_range_km: 115.0,
    end_ideal_range_km: 442.0,
    address: '曲江金地广场 Tesla V3 超级充电站',
    charger_type: '250kW Tesla V3 超级快充',
  },
  {
    id: 200,
    car_id: 1,
    start_date: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    end_date: new Date(Date.now() - 90 * 3600 * 1000).toISOString(),
    duration_min: 360,
    charge_energy_added: 38.5,
    charge_energy_used: 41.2,
    cost: 12.8,
    start_battery_level: 35,
    end_battery_level: 90,
    start_ideal_range_km: 180.0,
    end_ideal_range_km: 468.0,
    address: '大雁塔景区特斯拉公共充电站 (7kW AC)',
    charger_type: '7kW 交流目的地充电桩',
  },
];

// ==========================================
// 6. Mock 停车记录 (Parking)
// ==========================================
export const MOCK_PARKING: ParkingSummary[] = [
  {
    id: 301,
    car_id: 1,
    start_date: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    end_date: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    duration_min: 180,
    start_ideal_range_km: 435.0,
    end_ideal_range_km: 432.5,
    start_battery_level: 83,
    end_battery_level: 82,
    range_lost_km: 2.5,
    energy_lost_kwh: 0.38,
    drain_rate_kwh_per_hour: 0.126,
    address: '大雁塔北广场地下停车场 (哨兵开启)',
    is_home: false,
    has_charge: false,
  },
  {
    id: 300,
    car_id: 1,
    start_date: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    end_date: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    duration_min: 480,
    start_ideal_range_km: 440.0,
    end_ideal_range_km: 436.5,
    start_battery_level: 85,
    end_battery_level: 84,
    range_lost_km: 3.5,
    energy_lost_kwh: 0.54,
    drain_rate_kwh_per_hour: 0.067,
    address: '西安北站地下车库 P2 停车区',
    is_home: false,
    has_charge: false,
  },
];

// ==========================================
// 7. Mock 终身统计 (Lifetime Stats)
// ==========================================
export const MOCK_LIFETIME_STATS: LifetimeStats = {
  total_drives: 412,
  total_distance_km: 15288.8,
  total_drive_duration_hours: 386.4,
  total_energy_kwh: 2216.5,
  avg_efficiency_wh_km: 145,
  total_charges: 74,
  total_charge_energy_added: 2680.0,
  total_charge_cost: 846.5,
  sentry_duration_hours: 560,
  sleep_duration_hours: 1420.0,
};

// ==========================================
// 8. Mock 月度账单 (Monthly Reports)
// ==========================================
export const MOCK_MONTHLY_REPORTS: MonthlyReport[] = [
  {
    month: '2026-08',
    drive_count: 58,
    distance_km: 1420.6,
    drive_kwh: 206.0,
    avg_wh_km: 145,
    charge_count: 9,
    charge_energy_kwh: 235.0,
    charge_cost: 68.5,
    fuel_equivalent_cost: 909,
    saved_cost: 840,
  },
  {
    month: '2026-07',
    drive_count: 64,
    distance_km: 1680.2,
    drive_kwh: 248.5,
    avg_wh_km: 148,
    charge_count: 12,
    charge_energy_kwh: 275.0,
    charge_cost: 82.0,
    fuel_equivalent_cost: 1075,
    saved_cost: 993,
  },
  {
    month: '2026-06',
    drive_count: 50,
    distance_km: 1240.0,
    drive_kwh: 177.3,
    avg_wh_km: 143,
    charge_count: 8,
    charge_energy_kwh: 198.0,
    charge_cost: 58.2,
    fuel_equivalent_cost: 793,
    saved_cost: 735,
  },
];

// ==========================================
// 9. Mock 电池健康信息
// ==========================================
export const MOCK_BATTERY_HEALTH: BatteryHealthInfo = {
  nominal_full_pack_kwh: 60.0,
  current_usable_pack_kwh: 59.2,
  health_percent: 98.7,
  estimated_full_range_km: 432.5,
  original_full_range_km: 440.0,
  degradation_percent: 1.3,
  slow_charge_count: 62,
  fast_charge_count: 12,
  slow_charge_percent: 83.8,
  cycle_count: 42.5,
};
