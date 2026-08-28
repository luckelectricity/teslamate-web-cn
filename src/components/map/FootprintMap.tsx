'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FootprintDrivePath, VisitedLocation } from '@/types';
import { formatDateTime } from '@/lib/formatters';
import { Maximize2, Layers, Navigation } from 'lucide-react';

interface FootprintMapProps {
  paths: FootprintDrivePath[];
  locations?: VisitedLocation[];
  height?: string;
  className?: string;
}

export function FootprintMap({
  paths,
  locations = [],
  height = '520px',
  className = '',
}: FootprintMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedPath, setSelectedPath] = useState<FootprintDrivePath | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || paths.length === 0) return;

      const L = (await import('leaflet')).default;
      if (!isMounted) return;

      // 如果已有实例则销毁重新初始化
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // 默认初始中心（如果还没有点）
      const defaultCenter: [number, number] = [34.223881, 108.825993];

      const map = L.map(mapContainerRef.current, {
        attributionControl: false,
        zoomControl: true,
      }).setView(defaultCenter, 12);

      mapInstanceRef.current = map;

      // 高德地图暗色矢量图层（国内访问极速且与科技感深色 UI 完美契合）
      L.tileLayer(
        'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        {
          subdomains: ['1', '2', '3', '4'],
          maxZoom: 18,
          minZoom: 3,
        }
      ).addTo(map);

      const allLatLngs: [number, number][] = [];
      const featureGroup = L.featureGroup();

      // 绘制所有历史行程轨迹（重合路段自动物理叠加，呈现更亮的轨迹网）
      paths.forEach((path) => {
        if (!path.points || path.points.length < 2) return;

        path.points.forEach((pt) => allLatLngs.push(pt));

        const polyline = L.polyline(path.points, {
          color: '#E82127', // 特斯拉红
          weight: 3.5,
          opacity: 0.65,
          lineCap: 'round',
          lineJoin: 'round',
        });

        // 绑定点击事件与弹窗
        polyline.on('click', () => {
          setSelectedPath(path);
        });

        polyline.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #18181b; line-height: 1.5;">
            <div style="font-weight: bold; color: #dc2626;">🚗 ${path.distance} km 行程</div>
            <div style="color: #71717a; font-size: 11px; margin-top: 2px;">${formatDateTime(path.start_date)}</div>
            <div style="margin-top: 4px;"><strong>起：</strong>${path.start_address}</div>
            <div><strong>终：</strong>${path.end_address}</div>
          </div>
        `);

        polyline.addTo(featureGroup);
      });

      featureGroup.addTo(map);

      // 标记家与常驻地
      if (allLatLngs.length > 0) {
        // 第一条行程的起点通常是家
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

      // 🌟 核心算法：全量轨迹最小包围盒自适应缩放（Auto-fit bounds）
      if (allLatLngs.length > 0) {
        const bounds = L.latLngBounds(allLatLngs);
        map.fitBounds(bounds, {
          padding: [45, 45],
          maxZoom: 15,
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
  }, [paths]);

  // 重置回全景视野
  const handleResetBounds = () => {
    if (!mapInstanceRef.current || paths.length === 0) return;
    const allLatLngs = paths.flatMap((p) => p.points);
    if (allLatLngs.length > 0) {
      const L = (window as any).L;
      if (L) {
        mapInstanceRef.current.fitBounds(L.latLngBounds(allLatLngs), {
          padding: [45, 45],
          maxZoom: 15,
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
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow-sm shadow-blue-500/50" />
          <span>常用驻留点</span>
        </div>
      </div>
    </div>
  );
}
