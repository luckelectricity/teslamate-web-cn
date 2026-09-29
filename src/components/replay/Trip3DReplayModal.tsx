'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { DriveSummary, ReplayDriveItem, ReplayPoint } from '@/types';
import { formatDistance, formatDuration } from '@/lib/formatters';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Sliders,
  Sparkles,
  CheckSquare,
  Square,
  Navigation,
  Compass,
  Battery,
  Gauge,
  Calendar,
  Video,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

interface Trip3DReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDays?: number;
  initialDrives?: (DriveSummary | ReplayDriveItem)[];
}

export function Trip3DReplayModal({
  isOpen,
  onClose,
  initialDays = 7,
  initialDrives = [],
}: Trip3DReplayModalProps) {
  // 1. 响应式判断
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 2. 控制与设置状态
  const [days, setDays] = useState<number>(initialDays);
  const [drives, setDrives] = useState<ReplayDriveItem[]>([]);
  const [selectedDriveIds, setSelectedDriveIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 移动端默认收起抽屉，桌面端默认展开
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isCleanRecordMode, setIsCleanRecordMode] = useState<boolean>(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [followCar, setFollowCar] = useState<boolean>(true);

  // 3. 播放状态
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
  const [progressRatio, setProgressRatio] = useState<number>(0);
  const [currentPointIndex, setCurrentPointIndex] = useState<number>(0);

  // 4. 地图与动画 Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const carMarkerRef = useRef<any>(null);
  const plannedPolylineRef = useRef<any>(null);
  const passedPolylineRef = useRef<any>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // 为缺少 points 的 drive 生成保底平滑插值路径点
  const ensureDrivePoints = useCallback((driveList: (DriveSummary | ReplayDriveItem)[]): ReplayDriveItem[] => {
    return driveList.map((d, idx) => {
      const existingPoints = (d as ReplayDriveItem).points;
      if (Array.isArray(existingPoints) && existingPoints.length >= 2) {
        return d as ReplayDriveItem;
      }

      // 生成保底平滑道路点
      const startLat = (d as any).start_lat || 34.2594 + (idx % 5) * 0.015;
      const startLng = (d as any).start_lng || 108.9470 + (idx % 5) * 0.012;
      const endLat = (d as any).end_lat || 34.2120 + ((idx + 2) % 5) * 0.012;
      const endLng = (d as any).end_lng || 108.9650 - ((idx + 2) % 5) * 0.015;

      const ptCount = Math.max(50, Math.min(180, Math.round((d.distance || 5) * 12)));
      const points: ReplayPoint[] = [];
      const startTime = new Date(d.start_date).getTime();
      const endTime = new Date(d.end_date).getTime();

      for (let i = 0; i < ptCount; i++) {
        const ratio = i / (ptCount - 1);
        const lat = startLat + (endLat - startLat) * ratio + Math.sin(ratio * Math.PI) * 0.006;
        const lng = startLng + (endLng - startLng) * ratio + Math.cos(ratio * Math.PI) * 0.005;
        const currentSpeed = Math.round(
          Math.sin(ratio * Math.PI) * ((d.speed_max || 70) - 15) + (d.speed_avg || 40) * 0.6
        );
        const currentBattery = Math.round(
          (d.start_battery_level || 80) - ratio * ((d.start_battery_level || 80) - (d.end_battery_level || 75))
        );
        const currentTime = new Date(startTime + ratio * (endTime - startTime)).toISOString();

        points.push({
          lat,
          lng,
          speed: Math.max(0, currentSpeed),
          battery: currentBattery,
          time: currentTime,
          driveId: d.id,
        });
      }

      return {
        ...d,
        points,
      };
    });
  }, []);

  // 获取行程数据 (带末尾斜杠适配 trailingSlash: true)
  const fetchDrivesData = useCallback(async (selectedDays: number) => {
    setLoading(true);
    setLoadError(null);
    try {
      // 必须带 trailingSlash: /api/drives/replay/?days=
      const res = await fetch(`/api/drives/replay/?days=${selectedDays}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.drives) && data.drives.length > 0) {
        const enriched = ensureDrivePoints(data.drives);
        setDrives(enriched);

        // 默认选中非极小挪车行程
        const validIds = new Set<number>(
          enriched.filter((d) => (d.distance || 0) >= 0.5).map((d) => d.id)
        );
        setSelectedDriveIds(validIds.size > 0 ? validIds : new Set(enriched.map((d) => d.id)));
      } else {
        // 如果后端当前时间范围内没有返回，回退到 initialDrives 保底
        if (initialDrives.length > 0) {
          const enriched = ensureDrivePoints(initialDrives);
          setDrives(enriched);
          setSelectedDriveIds(new Set(enriched.map((d) => d.id)));
        } else {
          setDrives([]);
          setSelectedDriveIds(new Set());
        }
      }
    } catch (e: any) {
      console.warn('在线拉取回放行程失败，使用本地行程兜底:', e);
      setLoadError('接口连接超时，已切换至本地行程');
      if (initialDrives.length > 0) {
        const enriched = ensureDrivePoints(initialDrives);
        setDrives(enriched);
        setSelectedDriveIds(new Set(enriched.map((d) => d.id)));
      }
    } finally {
      setLoading(false);
    }
  }, [initialDrives, ensureDrivePoints]);

  // 打开弹窗初始化
  useEffect(() => {
    if (isOpen) {
      // 如果传入了初始行程，先立即渲染保底，避免等待
      if (initialDrives.length > 0) {
        const enriched = ensureDrivePoints(initialDrives);
        setDrives(enriched);
        const validIds = new Set<number>(
          enriched.filter((d) => (d.distance || 0) >= 0.5).map((d) => d.id)
        );
        setSelectedDriveIds(validIds.size > 0 ? validIds : new Set(enriched.map((d) => d.id)));
      }
      // 桌面端默认展开侧边面板，移动端默认收起
      setIsDrawerOpen(window.innerWidth >= 768);
      // 异步拉取最新高精轨迹点
      fetchDrivesData(days);
    } else {
      setIsPlaying(false);
      setProgressRatio(0);
      setCurrentPointIndex(0);
    }
  }, [isOpen, initialDrives, fetchDrivesData, days, ensureDrivePoints]);

  // 合并选中的行程生成连续平滑点集
  const activeTrajectoryPoints = useMemo(() => {
    const selected = drives
      .filter((d) => selectedDriveIds.has(d.id))
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    const points: ReplayPoint[] = [];
    selected.forEach((d) => {
      if (d.points && d.points.length > 0) {
        points.push(...d.points);
      }
    });
    return points;
  }, [drives, selectedDriveIds]);

  // 统计信息
  const selectedStats = useMemo(() => {
    const selected = drives.filter((d) => selectedDriveIds.has(d.id));
    const totalDist = selected.reduce((sum, d) => sum + (d.distance || 0), 0);
    const totalDuration = selected.reduce((sum, d) => sum + (d.duration_min || 0), 0);
    return {
      count: selected.length,
      distance: totalDist.toFixed(1),
      duration: totalDuration,
    };
  }, [drives, selectedDriveIds]);

  // 当前点位数据
  const currentPoint = useMemo(() => {
    if (activeTrajectoryPoints.length === 0) return null;
    const idx = Math.min(activeTrajectoryPoints.length - 1, Math.max(0, Math.floor(currentPointIndex)));
    return activeTrajectoryPoints[idx];
  }, [activeTrajectoryPoints, currentPointIndex]);

  // 当前所在路段行程
  const currentDrive = useMemo(() => {
    if (!currentPoint) return null;
    return drives.find((d) => d.id === currentPoint.driveId) || null;
  }, [currentPoint, drives]);

  // 航向角计算
  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const rad = Math.PI / 180;
    const y = Math.sin((lng2 - lng1) * rad) * Math.cos(lat2 * rad);
    const x =
      Math.cos(lat1 * rad) * Math.sin(lat2 * rad) -
      Math.sin(lat1 * rad) * Math.cos(lat2 * rad) * Math.cos((lng2 - lng1) * rad);
    const deg = Math.atan2(y, x) * (180 / Math.PI);
    return (deg + 360) % 360;
  };

  // 过滤短途挪车
  const filterShortTrips = () => {
    const newSelected = new Set<number>();
    drives.forEach((d) => {
      if ((d.distance || 0) >= 1.0 && (d.duration_min || 0) >= 3) {
        newSelected.add(d.id);
      }
    });
    setSelectedDriveIds(newSelected);
    resetPlayback();
  };

  // 全选 / 全不选
  const toggleSelectAll = () => {
    if (selectedDriveIds.size === drives.length) {
      setSelectedDriveIds(new Set());
    } else {
      setSelectedDriveIds(new Set(drives.map((d) => d.id)));
    }
    resetPlayback();
  };

  // 单项勾选切换
  const toggleDriveSelection = (id: number) => {
    const next = new Set(selectedDriveIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedDriveIds(next);
    resetPlayback();
  };

  // 重置播放
  const resetPlayback = () => {
    setIsPlaying(false);
    setProgressRatio(0);
    setCurrentPointIndex(0);
    lastTimestampRef.current = null;
  };

  // -------------------------------------------------------------
  // 地图初始化
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;
    let isMounted = true;

    async function initMap() {
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const center: [number, number] =
        activeTrajectoryPoints.length > 0
          ? [activeTrajectoryPoints[0].lat, activeTrajectoryPoints[0].lng]
          : [34.26, 108.94];

      const map = L.map(mapContainerRef.current, {
        attributionControl: false,
        zoomControl: false,
        fadeAnimation: true,
      }).setView(center, 13);

      mapInstanceRef.current = map;

      // 高德暗黑高精瓦片
      L.tileLayer(
        'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        {
          subdomains: ['1', '2', '3', '4'],
          maxZoom: 18,
          minZoom: 4,
        }
      ).addTo(map);

      // 1. 规划路线 (微光引导虚线)
      const allLatLngs: [number, number][] = activeTrajectoryPoints.map((p) => [p.lat, p.lng]);
      const plannedLine = L.polyline(allLatLngs, {
        color: '#ff4d4f',
        weight: 3.5,
        opacity: 0.35,
        dashArray: '4, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      plannedPolylineRef.current = plannedLine;

      // 2. 已驶过路线 (高亮纯正特斯拉红)
      const passedLine = L.polyline([], {
        color: '#E82127',
        weight: 5.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      passedPolylineRef.current = passedLine;

      // 3. 特斯拉 3D 车模 Marker
      const carIcon = L.divIcon({
        className: 'tesla-3d-car-marker',
        html: `
          <div id="car-vehicle-wrapper" style="transform: rotate(0deg); transition: transform 0.08s linear; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; position: relative;">
            <div style="position: absolute; width: 30px; height: 16px; border-radius: 50%; background: radial-gradient(ellipse at center, rgba(232, 33, 39, 0.75) 0%, rgba(232, 33, 39, 0) 70%); filter: blur(3px); transform: translateY(5px);"></div>
            <svg viewBox="0 0 60 110" width="26" height="48" style="filter: drop-shadow(0 3px 8px rgba(0,0,0,0.85));">
              <path d="M12,25 C12,14 18,6 30,6 C42,6 48,14 48,25 L50,65 C50,85 46,102 30,102 C14,102 10,85 10,65 Z" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1.5" />
              <path d="M16,30 C16,22 20,18 30,18 C40,18 44,22 44,30 L43,44 L17,44 Z" fill="#0F172A" />
              <rect x="18" y="47" width="24" height="24" rx="3" fill="#1E293B" stroke="#334155" stroke-width="0.8" />
              <path d="M17,74 L43,74 L42,86 C40,90 36,92 30,92 C24,92 20,90 18,86 Z" fill="#0F172A" />
              <polygon points="12,16 16,10 20,15" fill="#38BDF8" opacity="0.9" />
              <polygon points="48,16 44,10 40,15" fill="#38BDF8" opacity="0.9" />
              <path d="M12,94 Q30,100 48,94" stroke="#EF4444" stroke-width="3" fill="none" stroke-linecap="round" />
            </svg>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (allLatLngs.length > 0) {
        const carMarker = L.marker(allLatLngs[0], { icon: carIcon, zIndexOffset: 1000 }).addTo(map);
        carMarkerRef.current = carMarker;
        map.fitBounds(plannedLine.getBounds(), { padding: [50, 50], maxZoom: 16 });
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
  }, [isOpen, activeTrajectoryPoints]);

  // -------------------------------------------------------------
  // 动画循环
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isPlaying || activeTrajectoryPoints.length < 2) {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      lastTimestampRef.current = null;
      return;
    }

    const totalPts = activeTrajectoryPoints.length;

    const animateLoop = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }
      const deltaTime = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      const pointsPerSecond = 14 * playbackSpeed;
      const stepDelta = deltaTime * pointsPerSecond;

      setCurrentPointIndex((prev) => {
        const next = prev + stepDelta;
        if (next >= totalPts - 1) {
          setIsPlaying(false);
          setProgressRatio(1);
          return totalPts - 1;
        }

        const currentFloorIdx = Math.floor(next);
        const ratio = next / (totalPts - 1);
        setProgressRatio(ratio);

        updateCarAndPolyline(currentFloorIdx, next - currentFloorIdx);

        return next;
      });

      animFrameIdRef.current = requestAnimationFrame(animateLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying, activeTrajectoryPoints, playbackSpeed]);

  // 更新位置与渲染
  const updateCarAndPolyline = useCallback(
    (floorIdx: number, subT: number) => {
      if (!mapInstanceRef.current || activeTrajectoryPoints.length === 0) return;
      const pt1 = activeTrajectoryPoints[floorIdx];
      const pt2 = activeTrajectoryPoints[Math.min(floorIdx + 1, activeTrajectoryPoints.length - 1)];

      if (!pt1) return;

      const curLat = pt1.lat + (pt2.lat - pt1.lat) * subT;
      const curLng = pt1.lng + (pt2.lng - pt1.lng) * subT;

      const bearing = calculateBearing(pt1.lat, pt1.lng, pt2.lat, pt2.lng);

      if (carMarkerRef.current) {
        carMarkerRef.current.setLatLng([curLat, curLng]);
        const carEl = document.getElementById('car-vehicle-wrapper');
        if (carEl) {
          carEl.style.transform = `rotate(${Math.round(bearing)}deg)`;
        }
      }

      if (passedPolylineRef.current) {
        const passedCoords: [number, number][] = [];
        for (let i = 0; i <= floorIdx; i++) {
          passedCoords.push([activeTrajectoryPoints[i].lat, activeTrajectoryPoints[i].lng]);
        }
        passedCoords.push([curLat, curLng]);
        passedPolylineRef.current.setLatLngs(passedCoords);
      }

      if (followCar && mapInstanceRef.current) {
        mapInstanceRef.current.panTo([curLat, curLng], { animate: false });
      }
    },
    [activeTrajectoryPoints, followCar]
  );

  // 进度拖动
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgressRatio(val);
    if (activeTrajectoryPoints.length > 0) {
      const targetIdx = Math.floor(val * (activeTrajectoryPoints.length - 1));
      setCurrentPointIndex(targetIdx);
      updateCarAndPolyline(targetIdx, 0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-black text-white select-none overflow-hidden">
      {/* ========================================================= */}
      {/* 1. 地图主舞台 (自适应占满) */}
      {/* ========================================================= */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-zinc-950">
        {/* 3D 透视倾角包裹层 */}
        <div
          className="w-full h-full transition-transform duration-500 origin-bottom"
          style={
            is3DMode
              ? {
                  perspective: isMobile ? '800px' : '1000px',
                  transform: isMobile ? 'rotateX(26deg) scale(1.04)' : 'rotateX(34deg) scale(1.06)',
                  transformStyle: 'preserve-3d',
                }
              : undefined
          }
        >
          <div ref={mapContainerRef} className="w-full h-full bg-zinc-950" />
        </div>

        {/* ========================================================= */}
        {/* 2. 悬浮 HUD 仪表台 (手机/桌面双模自适应) */}
        {/* ========================================================= */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none flex flex-col gap-2 max-w-[calc(100vw-120px)] sm:max-w-sm">
          {/* 实时仪表盘卡片 */}
          <div className="bg-zinc-900/85 backdrop-blur-md border border-zinc-700/60 px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-xl flex items-center gap-3 sm:gap-4 pointer-events-auto">
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-mono leading-none">
                  {currentPoint ? currentPoint.speed : 0}
                </span>
                <span className="text-[10px] font-semibold text-zinc-400">km/h</span>
              </div>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">SPEED</span>
            </div>

            <div className="h-8 w-px bg-zinc-700/60" />

            <div className="flex flex-col gap-0.5 text-xs">
              <div className="flex items-center gap-1.5">
                <Battery className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-bold text-zinc-100 text-xs sm:text-sm">
                  {currentPoint ? `${currentPoint.battery}%` : '--'}
                </span>
                <span className="text-[10px] text-zinc-500">电量</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="font-bold text-zinc-100 text-[11px] sm:text-xs">
                  {(parseFloat(selectedStats.distance) * progressRatio).toFixed(1)} / {selectedStats.distance} km
                </span>
              </div>
            </div>
          </div>

          {/* 当前行驶路段提示 */}
          {currentDrive && !isCleanRecordMode && (
            <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-lg flex flex-col gap-0.5 pointer-events-auto">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                <span className="truncate">{currentPoint ? currentPoint.time.replace('T', ' ').slice(0, 19) : ''}</span>
              </div>
              <div className="text-[11px] font-medium text-zinc-200 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{currentDrive.start_address}</span>
                <span className="text-zinc-500 text-[9px] shrink-0">➔</span>
                <span className="truncate">{currentDrive.end_address}</span>
              </div>
            </div>
          )}
        </div>

        {/* 顶部右侧：纯净录屏模式 / 抽屉开关 / 关闭 */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          {/* 纯净录屏模式开关 */}
          <button
            onClick={() => setIsCleanRecordMode(!isCleanRecordMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-xl backdrop-blur-md border ${
              isCleanRecordMode
                ? 'bg-red-500/25 text-red-400 border-red-500/50 ring-2 ring-red-500/40'
                : 'bg-zinc-900/80 text-zinc-200 border-zinc-700/60 hover:bg-zinc-800'
            }`}
          >
            <Video className={`w-3.5 h-3.5 ${isCleanRecordMode ? 'animate-pulse text-red-500' : ''}`} />
            <span className="hidden sm:inline">{isCleanRecordMode ? '录屏中' : '纯净录屏'}</span>
          </button>

          {/* 行程定制抽屉按钮 */}
          {!isCleanRecordMode && (
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className={`flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold transition-all shadow-xl backdrop-blur-md ${
                isDrawerOpen
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-zinc-900/80 text-zinc-300 border-zinc-700/60 hover:bg-zinc-800'
              }`}
              title="配置行程"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">选行程</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-300">
                {selectedStats.count}
              </span>
            </button>
          )}

          {/* 关闭退出 */}
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-zinc-900/80 hover:bg-red-500/20 hover:text-red-400 border border-zinc-700/60 text-zinc-400 transition-all shadow-xl backdrop-blur-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* 3. 底部悬浮控制台 (手机端双层紧凑 / 桌面端开阔) */}
        {/* ========================================================= */}
        <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/60 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col gap-2.5">
          {/* 进度条与里程 */}
          <div className="flex items-center gap-2.5 w-full">
            <span className="text-[10px] sm:text-xs font-mono text-zinc-400 w-8 text-right">
              {Math.round(progressRatio * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={progressRatio}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500 focus:outline-none"
            />
            <span className="text-[10px] sm:text-xs font-mono text-zinc-300 shrink-0">
              {selectedStats.distance} km
            </span>
          </div>

          {/* 播放控制与倍速栏 */}
          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-zinc-800/80">
            {/* 播放 / 暂停 / 重放 */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all shadow-md shadow-red-600/30 shrink-0"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
              </button>

              <button
                onClick={resetPlayback}
                className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors shrink-0"
                title="重新从头开始"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 倍速切换 */}
            <div className="flex items-center bg-zinc-950/70 p-0.5 rounded-xl border border-zinc-800 text-[11px] sm:text-xs">
              {[1, 2, 5, 10, 20].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg font-bold transition-all ${
                    playbackSpeed === spd
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* 视角切换 */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIs3DMode(!is3DMode)}
                className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1 border transition-all ${
                  is3DMode
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                <Compass className="w-3 h-3" />
                <span className="hidden sm:inline">3D</span>
              </button>

              <button
                onClick={() => setFollowCar(!followCar)}
                className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1 border transition-all ${
                  followCar
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                <Navigation className="w-3 h-3" />
                <span className="hidden sm:inline">跟随</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. 行程选择定制抽屉 (手机端为底部半屏抽屉 / 桌面端为右侧面板) */}
      {/* ========================================================= */}
      {!isCleanRecordMode && isDrawerOpen && (
        <div
          className={`bg-zinc-950 border-zinc-800 flex flex-col z-30 shadow-2xl transition-all ${
            isMobile
              ? 'absolute bottom-0 left-0 right-0 max-h-[75vh] h-[70vh] rounded-t-3xl border-t border-x'
              : 'w-80 md:w-96 h-full border-l shrink-0'
          }`}
        >
          {/* 抽屉头部 */}
          <div className="p-3.5 sm:p-4 border-b border-zinc-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="text-xs sm:text-sm font-bold text-white">回放行程定制</h2>
                {loading && <RefreshCw className="w-3 h-3 text-red-400 animate-spin" />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  已选 {selectedStats.count} / {drives.length} 段
                </span>
                {isMobile && (
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-lg bg-zinc-800 text-zinc-400"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 天数快速切换 */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>时间跨度:</span>
                <span className="font-bold text-red-400 font-mono">最近 {days} 天</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 3, 5, 7, 10].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDays(d);
                      fetchDrivesData(d);
                      resetPlayback();
                    }}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      days === d
                        ? 'bg-red-500 text-white font-bold'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    {d === 1 ? '今天' : `${d}天`}
                  </button>
                ))}
              </div>
            </div>

            {/* 智能辅助与全选按钮 */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                onClick={filterShortTrips}
                className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium"
                title="自动取消勾选距离 < 1km 或耗时 < 3分钟的短途挪车"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>过滤短途挪车</span>
              </button>

              <button
                onClick={toggleSelectAll}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-medium"
              >
                {selectedDriveIds.size === drives.length ? '全不选' : '全选'}
              </button>
            </div>

            {loadError && (
              <div className="text-[10px] text-amber-400 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                {loadError}
              </div>
            )}
          </div>

          {/* 行程列表滚动区 */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {loading && drives.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-500 text-xs gap-2">
                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <span>正在提取最近行程轨迹...</span>
              </div>
            ) : drives.length === 0 ? (
              <div className="text-center py-14 text-zinc-500 text-xs flex flex-col items-center gap-2">
                <span>所选时间范围内未发现行程记录</span>
                <button
                  onClick={() => {
                    setDays(10);
                    fetchDrivesData(10);
                  }}
                  className="px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"
                >
                  扩大到最近 10 天
                </button>
              </div>
            ) : (
              drives.map((drive) => {
                const isChecked = selectedDriveIds.has(drive.id);
                const isShort = (drive.distance || 0) < 1.0;

                return (
                  <div
                    key={drive.id}
                    onClick={() => toggleDriveSelection(drive.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                      isChecked
                        ? 'bg-zinc-900/90 border-red-500/40 shadow-sm'
                        : 'bg-zinc-950/60 border-zinc-900 text-zinc-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        )}
                        <span className="text-[11px] font-mono font-medium text-zinc-300">
                          {drive.start_date.slice(5, 16).replace('T', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {isShort && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            挪车
                          </span>
                        )}
                        <span className="text-xs font-bold text-zinc-200">
                          {drive.distance} km
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-400 pl-5 flex flex-col gap-0.5">
                      <div className="truncate text-zinc-300">
                        {drive.start_address || '起点未知'}
                      </div>
                      <div className="truncate text-zinc-400 text-[10px]">
                        ➔ {drive.end_address || '终点未知'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pl-5 pt-0.5 border-t border-zinc-900">
                      <span>耗时 {drive.duration_min} 分钟</span>
                      <span>均速 {drive.speed_avg} km/h</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 底部确认按钮 */}
          <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>已选行程总里程:</span>
              <span className="font-bold text-white font-mono text-sm">{selectedStats.distance} km</span>
            </div>
            <button
              onClick={() => {
                resetPlayback();
                setIsPlaying(true);
                if (isMobile) setIsDrawerOpen(false);
              }}
              disabled={selectedStats.count === 0}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>立即开始 3D 回放</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
