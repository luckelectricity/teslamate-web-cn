import { wgs84ToGcj02 } from './coordtransform';

// 内存高频坐标缓存 (Key: lat_lng_rounded)
const geoCache = new Map<string, string>();

/**
 * 通过高德地图 / 国内高精服务逆地理编码解析经纬度
 * @param lat 纬度 (WGS84)
 * @param lng 经度 (WGS84)
 * @param geofenceName 可选的地理围栏名称 (如 "家")
 */
export async function reverseGeocodeAddress(
  lat?: number | null,
  lng?: number | null,
  geofenceName?: string | null
): Promise<string> {
  // 1. 若有已设定的地理围栏名称，优先使用
  if (geofenceName && geofenceName.trim().length > 0) {
    return geofenceName.trim();
  }

  if (!lat || !lng || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
    return '位置解析中';
  }

  // 2. 转换成高德地图 GCJ-02 火星坐标系
  const [gcjLng, gcjLat] = wgs84ToGcj02(lng, lat);
  const cacheKey = `${gcjLat.toFixed(4)}_${gcjLng.toFixed(4)}`;

  if (geoCache.has(cacheKey)) {
    return geoCache.get(cacheKey)!;
  }

  // 3. 如果环境变量配置了 AMAP_KEY，直接调用高德官方高精逆地理 API
  const amapKey = process.env.AMAP_KEY || process.env.NEXT_PUBLIC_AMAP_KEY;
  if (amapKey) {
    try {
      const res = await fetch(
        `https://restapi.amap.com/v3/geocode/regeo?key=${amapKey}&location=${gcjLng.toFixed(6)},${gcjLat.toFixed(6)}&extensions=base&radius=500`,
        { next: { revalidate: 86400 } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === '1' && data.regeocode) {
          const comp = data.regeocode.addressComponent;
          const road = comp.streetNumber?.street || comp.township || '';
          const district = comp.district || comp.city || '';
          const formatted = data.regeocode.formatted_address || `${district} ${road}`;
          // 提取核心地标名
          const shortName = (road && district) ? `${district} · ${road}` : formatted;
          if (shortName) {
            geoCache.set(cacheKey, shortName);
            return shortName;
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // 4. 国内公用开放高精逆地理通道
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=zh`,
      {
        headers: { 'User-Agent': 'TeslaMateCN/1.0' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      if (addr) {
        const road = addr.road || addr.street || addr.neighbourhood || addr.suburb || addr.amenity || '';
        const district = addr.city || addr.district || addr.county || '西安';

        let result = '';
        if (road && district) {
          result = `${district} · ${road}`;
        } else if (road) {
          result = road;
        } else if (district) {
          result = district;
        }

        if (result) {
          geoCache.set(cacheKey, result);
          return result;
        }
      }
    }
  } catch (err) {
    // ignore
  }

  // 5. 坐标格式化回退
  const fallback = `位置 (${gcjLat.toFixed(3)}, ${gcjLng.toFixed(3)})`;
  geoCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * 生成高德地图外链导航 / 定位 URL
 */
export function getAmapLocationUrl(lat: number, lng: number, name?: string): string {
  const [gcjLng, gcjLat] = wgs84ToGcj02(lng, lat);
  const encodedName = encodeURIComponent(name || '行程位置');
  return `https://uri.amap.com/marker?position=${gcjLng.toFixed(6)},${gcjLat.toFixed(6)}&name=${encodedName}&src=mypage&coordinate=gaode&callnative=1`;
}
