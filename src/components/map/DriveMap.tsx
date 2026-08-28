'use client';

import React, { useEffect, useRef } from 'react';
import { PositionPoint } from '@/types';
import { wgs84ToGcj02 } from '@/lib/coordtransform';

interface DriveMapProps {
  positions: PositionPoint[];
  currentPointIndex?: number;
  height?: string;
  className?: string;
}

export function DriveMap({
  positions,
  currentPointIndex,
  height = '400px',
  className = '',
}: DriveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const currentMarkerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || positions.length === 0) return;

      const L = (await import('leaflet')).default;

      if (!isMounted) return;

      // 如果已有实例则销毁
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // 纠偏转换坐标：WGS84 -> GCJ02 (高德/国内地图)
      const latLngs: [number, number][] = positions.map((p) => {
        const [gcjLng, gcjLat] = wgs84ToGcj02(p.longitude, p.latitude);
        return [gcjLat, gcjLng];
      });

      const firstPoint = latLngs[0];

      // 初始化地图
      const map = L.map(mapContainerRef.current, {
        attributionControl: false,
        zoomControl: true,
      }).setView(firstPoint, 13);

      mapInstanceRef.current = map;

      // 添加瓦片图层（高德地图矢量切片，国内极速无漂移）
      L.tileLayer(
        'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        {
          subdomains: ['1', '2', '3', '4'],
          maxZoom: 18,
          minZoom: 3,
        }
      ).addTo(map);

      // 绘制行车轨迹
      const polyline = L.polyline(latLngs, {
        color: '#E82127', // 特斯拉红
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polylineRef.current = polyline;

      // 添加起点 Marker
      const startIcon = L.divIcon({
        className: 'custom-start-marker',
        html: `<div style="background-color: #10B981; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker(latLngs[0], { icon: startIcon }).addTo(map).bindPopup('🏁 起点');

      // 添加终点 Marker
      const endIcon = L.divIcon({
        className: 'custom-end-marker',
        html: `<div style="background-color: #EF4444; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker(latLngs[latLngs.length - 1], { icon: endIcon })
        .addTo(map)
        .bindPopup('🎯 终点');

      // 自适应边界
      map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [positions]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height }}
      className={`w-full rounded-2xl overflow-hidden shadow-inner border border-zinc-800 bg-zinc-900 relative z-10 ${className}`}
    />
  );
}
