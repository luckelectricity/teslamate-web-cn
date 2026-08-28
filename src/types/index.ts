// 视图模式
export type ViewMode = 'auto' | 'mobile' | 'desktop';

// 车辆实时状态
export interface Car {
  id: number;
  name: string;
  model: string;
  trim_badging: string;
  vin: string;
  exterior_color: string;
  wheel_type: string;
  usable_battery_level: number;
  battery_level: number;
  ideal_battery_range_km: number;
  est_battery_range_km: number;
  odometer: number;
  speed: number;
  power: number;
  state: 'driving' | 'charging' | 'asleep' | 'online' | 'offline' | 'suspended' | string;
  since: string | null;
  inside_temp: number | null;
  outside_temp: number | null;
  is_climate_on: boolean;
  is_locked: boolean;
  is_sentry_mode: boolean;
  doors_open: boolean;
  windows_open: boolean;
  frunk_open: boolean;
  trunk_open: boolean;
  tire_pressure_fl: number;
  tire_pressure_fr: number;
  tire_pressure_rl: number;
  tire_pressure_rr: number;
  latitude: number | null;
  longitude: number | null;
  address: string;
  version: string;
  battery_heater: boolean;
}

// 行程摘要
export interface DriveSummary {
  id: number;
  car_id: number;
  start_date: string;
  end_date: string;
  duration_min: number;
  distance: number;
  speed_max: number;
  speed_avg: number;
  power_max: number;
  power_min: number;
  start_address: string;
  end_address: string;
  start_battery_level: number;
  end_battery_level: number;
  consumption_kwh: number;
  efficiency_wh_km: number;
  start_position_id?: number;
  end_position_id?: number;
  ascent?: number;
  descent?: number;
  outside_temp_avg?: number;
}

// 行程详情与轨迹点
export interface DriveDetail extends DriveSummary {
  positions: PositionPoint[];
}

export interface PositionPoint {
  id: number;
  date: string;
  latitude: number;
  longitude: number;
  speed: number;
  power: number;
  battery_level: number;
  odometer: number;
  elevation: number;
  inside_temp?: number | null;
  outside_temp?: number | null;
}

// 🗺️ 全量足迹轨迹段 (用于绘制全景行车大地图)
export interface FootprintDrivePath {
  id: number;
  start_date: string;
  distance: number;
  duration_min: number;
  start_address: string;
  end_address: string;
  points: [number, number][]; // [lat, lng] GCJ-02
}

// 停车段摘要
export interface ParkingSummary {
  id: number;
  car_id: number;
  start_date: string;
  end_date: string;
  duration_min: number;
  start_ideal_range_km: number;
  end_ideal_range_km: number;
  start_battery_level: number;
  end_battery_level: number;
  range_lost_km: number;
  energy_lost_kwh: number;
  drain_rate_kwh_per_hour: number;
  address: string;
  is_home: boolean;
  has_charge: boolean;
  sleep_hours?: number;
  online_hours?: number;
}

// 停车详情
export interface ParkingDetail extends ParkingSummary {
  points: ParkingPoint[];
}

export interface ParkingPoint {
  date: string;
  battery_level: number;
  ideal_battery_range_km: number;
  inside_temp?: number | null;
  outside_temp?: number | null;
  state?: string;
}

// 充电记录摘要
export interface ChargeSummary {
  id: number;
  car_id: number;
  start_date: string;
  end_date: string;
  duration_min: number;
  charge_energy_added: number;
  charge_energy_used: number;
  start_battery_level: number;
  end_battery_level: number;
  start_ideal_range_km: number;
  end_ideal_range_km: number;
  cost: number;
  address: string;
  fast_charger_brand?: string;
  charger_type?: string;
}

export interface ChargeDetail extends ChargeSummary {
  points: ChargePoint[];
}

export interface ChargePoint {
  date: string;
  battery_level: number;
  charge_energy_added: number;
  charger_power: number;
  charger_voltage?: number;
  charger_actual_current?: number;
  outside_temp?: number | null;
}

// 电量去向深度剖析
export interface EnergyBreakdown {
  total_energy_added_kwh: number;
  grid_energy_used_kwh: number;
  driving_energy_kwh: number;
  parking_drain_kwh: number;
  charging_loss_kwh: number;
  remaining_in_battery_kwh: number;
  driving_percent: number;
  parking_percent: number;
  charging_efficiency_percent: number;
  online_hours: number;
  sleep_hours: number;
}

// 🔋 电池健康与衰减模型
export interface BatteryHealthInfo {
  nominal_full_pack_kwh: number;
  current_usable_pack_kwh: number;
  health_percent: number;
  estimated_full_range_km: number;
  original_full_range_km: number;
  degradation_percent: number;
  slow_charge_count: number;
  fast_charge_count: number;
  slow_charge_percent: number;
  cycle_count: number;
}

// 📅 月度能耗报告
export interface MonthlyReport {
  month: string;
  drive_count: number;
  distance_km: number;
  drive_kwh: number;
  avg_wh_km: number;
  charge_count: number;
  charge_energy_kwh: number;
  charge_cost: number;
  fuel_equivalent_cost: number;
  saved_cost: number;
}

// 🌡️ 气温能耗关联点
export interface TemperatureEfficiencyPoint {
  temp: number;
  drive_count: number;
  avg_wh_km: number;
}

// 🗺️ 常用地点驻留统计
export interface VisitedLocation {
  name: string;
  visit_count: number;
  total_parking_hours: number;
  is_home: boolean;
  latitude?: number;
  longitude?: number;
}

// 全生命周期统计
export interface LifetimeStats {
  total_drives: number;
  total_distance_km: number;
  total_drive_duration_hours: number;
  total_energy_kwh: number;
  avg_efficiency_wh_km: number;
  total_charges: number;
  total_charge_energy_added: number;
  total_charge_cost: number;
  sentry_duration_hours: number;
  sleep_duration_hours: number;
}
