import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDistance(km: number | null | undefined): string {
  if (km == null || isNaN(km)) return '0 km';
  return `${km.toFixed(1)} km`;
}

export function formatSpeed(kmh: number | null | undefined): string {
  if (kmh == null || isNaN(kmh)) return '0 km/h';
  return `${Math.round(kmh)} km/h`;
}

export function formatPower(kw: number | null | undefined): string {
  if (kw == null || isNaN(kw)) return '0 kW';
  return `${kw.toFixed(1)} kW`;
}

export function formatEnergy(kwh: number | null | undefined): string {
  if (kwh == null || isNaN(kwh)) return '0 kWh';
  return `${kwh.toFixed(2)} kWh`;
}

export function formatEfficiency(whkm: number | null | undefined): string {
  if (whkm == null || isNaN(whkm)) return '0 Wh/km';
  return `${Math.round(whkm)} Wh/km`;
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || isNaN(minutes) || minutes <= 0) return '0分钟';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) return `${mins} 分钟`;
  return `${hrs} 小时 ${mins} 分钟`;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '¥0.00';
  return `¥${amount.toFixed(2)}`;
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '--';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(d, 'yyyy-MM-dd HH:mm', { locale: zhCN });
  } catch {
    return dateStr;
  }
}

export function formatTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '--';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
  } catch {
    return dateStr;
  }
}

export function getCarStateInfo(state: string | null | undefined) {
  switch (state) {
    case 'driving':
      return { text: '行驶中', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
    case 'charging':
      return { text: '充电中', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    case 'asleep':
      return { text: '睡眠中', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' };
    case 'online':
      return { text: '已唤醒', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    case 'suspended':
      return { text: '准备睡眠', color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30' };
    default:
      return { text: '离线', color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30' };
  }
}
