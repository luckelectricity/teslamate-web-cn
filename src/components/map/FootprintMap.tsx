'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FootprintDrivePath, VisitedLocation } from '@/types';
import { formatDateTime } from '@/lib/formatters';
import { Maximize2, Layers, Navigation, Sparkles } from 'lucide-react';

interface FootprintMapProps {
  paths: FootprintDrivePath[];
  locations?: VisitedLocation[];
  height?: string;
  className?: string;
  selectedPathId?: number | null;
  onSelectPath?: (path: FootprintDrivePath | null) => void;
}

export function FootprintMap({
  paths,
  locations = [],
  height = '520px',
  className = '',
  selectedPathId = null,
  onSelectPath,
}: FootprintMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polylinesMapRef = useRef<Map<number, { poly: any; glow: any }>>(new Map());

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted) return;

      // 如果已有实例则销毁重新初始化
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        polylinesMapRef.current.clear();
      }

      // 默认初始中心（西安核心区）
      const defaultCenter: [number, number] = [34.26, 108.94];

      const map = L.map(mapContainerRef.current, {
        attributionControl: false,
        zoomControl: true,
      }).setView(defaultCenter, 11);

      mapInstanceRef.current = map;

      // 高德地图暗色高精图层
      L.tileLayer(
        'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        {
          subdomains: ['1', '2', '3', '4'],
          maxZoom: 18,
          minZoom: 4,
        }
      ).addTo(map);

      const allLatLngs: [number, number][] = [];
      const featureGroup = L.featureGroup();

      // 绘制所有轨迹
      paths.forEach((path) => {
        if (!path.points || path.points.length < 2) return;

        path.points.forEach((pt) => allLatLngs.push(pt));

        const isSelected = selectedPathId === path.id;

        // 1. 底层发光微光晕
        const glowLine = L.polyline(path.points, {
          color: isSelected ? '#38bdf8' : '#ef4444',
          weight: isSelected ? 10 : 6,
          opacity: isSelected ? 0.6 : (selectedPathId ? 0.15 : 0.3),
          lineCap: 'round',
          lineJoin: 'round',
        });
        glowLine.addTo(featureGroup);

        // 2. 表层鲜亮核心轨迹
        const polyline = L.polyline(path.points, {
          color: isSelected ? '#00f2ff' : '#ff2a32',
          weight: isSelected ? 4.5 : 3,
          opacity: isSelected ? 1.0 : (selectedPathId ? 0.35 : 0.85),
          lineCap: 'round',
          lineJoin: 'round',
        });

        polyline.on('click', () => {
          if (onSelectPath) {
            onSelectPath(isSelected ? null : path);
          }
        });

        polyline.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #18181b; line-height: 1.5; padding: 2px;">
            <div style="font-weight: bold; color: #dc2626; font-size: 13px;">🚗 ${path.distance} km 行程</div>
            <div style="color: #71717a; font-size: 11px; margin-top: 2px;">${formatDateTime(path.start_date)}</div>
            <div style="margin-top: 6px;"><strong>起：</strong>${path.start_address}</div>
            <div><strong>终：</strong>${path.end_address}</div>
          </div>
        `);

        polyline.addTo(featureGroup);
        polylinesMapRef.current.set(path.id, { poly: polyline, glow: glowLine });
      });

      featureGroup.addTo(map);

      // 标记家与常驻地
      if (allLatLngs.length > 0) {
        const homePoint = paths[0]?.points[0] || allLatLngs[0];
        const homeIcon = L.divIcon({
          className: 'custom-home-pin',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(59, 130, 246, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; width: 14px; height: 14px; border-radius: 50%; background: #3b82f6; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker(homePoint, { icon: homeIcon })
          .addTo(map)
          .bindPopup('🏠 常用出发点 (家里车位)');
      }

      // 自适应缩放
      if (selectedPathId) {
        const selected = paths.find((p) => p.id === selectedPathId);
        if (selected && selected.points && selected.points.length > 0) {
          map.fitBounds(L.latLngBounds(selected.points), {
            padding: [50, 50],
            maxZoom: 15,
          });
        }
      } else if (allLatLngs.length > 0) {
        const bounds = L.latLngBounds(allLatLngs);
        map.fitBounds(bounds, {
          padding: [45, 45],
          maxZoom: 14,
        });
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [paths, selectedPathId]);

  // 重置回全景视野
  const handleResetBounds = () => {
    if (!mapInstanceRef.current || paths.length === 0) return;
    const allLatLngs = paths.flatMap((p) => p.points);
    if (allLatLngs.length > 0) {
      const L = (window as any).L;
      if (L) {
        mapInstanceRef.current.fitBounds(L.latLngBounds(allLatLngs), {
          padding: [45, 45],
          maxZoom: 14,
        });
      }
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-950">
      <div
        ref={mapContainerRef}
        style={{ height }}
        className={`w-full relative z-10 ${className}`}
      />

      {/* 地图悬浮操作浮窗 */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleResetBounds}
          className="bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white p-2.5 rounded-2xl border border-zinc-700 shadow-xl backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 text-xs"
          title="居中适应全景足迹"
        >
          <Maximize2 className="w-4 h-4 text-red-500" />
          <span className="hidden sm:inline font-medium">全景自适应</span>
        </button>
      </div>

      {/* 底部悬浮指示卡 */}
      <div className="absolute bottom-4 left-4 z-20 bg-zinc-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-zinc-800 text-xs shadow-xl flex items-center gap-3 text-zinc-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/50" />
          <span>行车轨迹 ({paths.length} 段)</span>
        </div>
        {selectedPathId && (
          <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
            <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50 animate-pulse" />
            <span>已高亮选中单程</span>
          </div>
        )}
      </div>
    </div>
  );
}
