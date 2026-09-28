'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ReplayDriveItem, ReplayPoint } from '@/types';
import { formatDistance, formatDuration } from '@/lib/formatters';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Maximize2,
  Minimize2,
  X,
  Sliders,
  Sparkles,
  CheckSquare,
  Square,
  ChevronRight,
  ChevronLeft,
  Navigation,
  Compass,
  Layers,
  Battery,
  Gauge,
  Calendar,
  Eye,
  EyeOff,
  Video,
} from 'lucide-react';

interface Trip3DReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDays?: number;
  initialDrives?: ReplayDriveItem[];
}

export function Trip3DReplayModal({
  isOpen,
  onClose,
  initialDays = 7,
  initialDrives = [],
}: Trip3DReplayModalProps) {
  // 1. 控制与设置状态
  const [days, setDays] = useState<number>(initialDays);
  const [drives, setDrives] = useState<ReplayDriveItem[]>(initialDrives);
  const [selectedDriveIds, setSelectedDriveIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isCleanRecordMode, setIsCleanRecordMode] = useState<boolean>(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [followCar, setFollowCar] = useState<boolean>(true);

  // 2. 播放状态
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(5); // 5x 默认平顺
  const [progressRatio, setProgressRatio] = useState<number>(0); // 0 ~ 1
  const [currentPointIndex, setCurrentPointIndex] = useState<number>(0);

  // 3. 地图与动画 Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const carMarkerRef = useRef<any>(null);
  const plannedPolylineRef = useRef<any>(null);
  const passedPolylineRef = useRef<any>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // 获取行程数据 (切换天数时触发)
  const fetchDrivesData = useCallback(async (selectedDays: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drives/replay?days=${selectedDays}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.drives)) {
        setDrives(data.drives);
        // 默认选中所有有效行程 (剔除 < 0.2km 的极短挪车)
        const validIds = new Set<number>(
          data.drives.filter((d: ReplayDriveItem) => (d.distance || 0) >= 0.5).map((d: ReplayDriveItem) => d.id)
        );
        setSelectedDriveIds(validIds.size > 0 ? validIds : new Set(data.drives.map((d: any) => d.id)));
      }
    } catch (e) {
      console.error('加载回放行程失败:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 打开弹窗且无初始数据时拉取
  useEffect(() => {
    if (isOpen) {
      if (initialDrives.length === 0) {
        fetchDrivesData(days);
      } else {
        setDrives(initialDrives);
        const validIds = new Set<number>(
          initialDrives.filter((d) => (d.distance || 0) >= 0.5).map((d) => d.id)
        );
        setSelectedDriveIds(validIds.size > 0 ? validIds : new Set(initialDrives.map((d) => d.id)));
      }
    } else {
      setIsPlaying(false);
      setProgressRatio(0);
      setCurrentPointIndex(0);
    }
  }, [isOpen, initialDrives, fetchDrivesData, days]);

  // 合并选中的行程生成连续平滑点集 (从早到晚的时间顺序)
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

  // 当前播放位置的实时数据
  const currentPoint = useMemo(() => {
    if (activeTrajectoryPoints.length === 0) return null;
    const idx = Math.min(
      activeTrajectoryPoints.length - 1,
      Math.max(0, currentPointIndex)
    );
    return activeTrajectoryPoints[idx];
  }, [activeTrajectoryPoints, currentPointIndex]);

  // 当前所在路段行程
  const currentDrive = useMemo(() => {
    if (!currentPoint) return null;
    return drives.find((d) => d.id === currentPoint.driveId) || null;
  }, [currentPoint, drives]);

  // 航向角计算公式 (根据两点计算朝向 0~360度)
  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const rad = Math.PI / 180;
    const y = Math.sin((lng2 - lng1) * rad) * Math.cos(lat2 * rad);
    const x =
      Math.cos(lat1 * rad) * Math.sin(lat2 * rad) -
      Math.sin(lat1 * rad) * Math.cos(lat2 * rad) * Math.cos((lng2 - lng1) * rad);
    const deg = Math.atan2(y, x) * (180 / Math.PI);
    return (deg + 360) % 360;
  };

  // 快捷智能筛选：过滤短途挪车 (< 1.0 km)
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

  // 全选 / 取消全选
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
  // 地图初始化与图层绘制
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

      // 默认初始中心点
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

      // 暗黑科技风高德底图
      L.tileLayer(
        'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        {
          subdomains: ['1', '2', '3', '4'],
          maxZoom: 18,
          minZoom: 4,
        }
      ).addTo(map);

      // 1. 完整规划路线 (暗红色夜间微光引导)
      const allLatLngs: [number, number][] = activeTrajectoryPoints.map((p) => [p.lat, p.lng]);
      const plannedLine = L.polyline(allLatLngs, {
        color: '#ff4d4f',
        weight: 4,
        opacity: 0.35,
        dashArray: '4, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      plannedPolylineRef.current = plannedLine;

      // 2. 已驶过路线 (高亮纯正特斯拉能量红，发光实体)
      const passedLine = L.polyline([], {
        color: '#E82127',
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      passedPolylineRef.current = passedLine;

      // 3. 3D 汽车 Marker (精工矢量特斯拉车模与光芒)
      const carIcon = L.divIcon({
        className: 'tesla-3d-car-marker',
        html: `
          <div id="car-vehicle-wrapper" style="transform: rotate(0deg); transition: transform 0.08s linear; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; position: relative;">
            <!-- 车底发光与地面投影 -->
            <div style="position: absolute; width: 34px; height: 18px; border-radius: 50%; background: radial-gradient(ellipse at center, rgba(232, 33, 39, 0.7) 0%, rgba(232, 33, 39, 0) 70%); filter: blur(3px); transform: translateY(6px);"></div>
            <!-- 3D 俯瞰车身 SVG (Tesla 极简风) -->
            <svg viewBox="0 0 60 110" width="30" height="55" style="filter: drop-shadow(0 4px 10px rgba(0,0,0,0.85));">
              <!-- 车身主体 -->
              <path d="M12,25 C12,14 18,6 30,6 C42,6 48,14 48,25 L50,65 C50,85 46,102 30,102 C14,102 10,85 10,65 Z" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1.5" />
              <!-- 前挡风玻璃 -->
              <path d="M16,30 C16,22 20,18 30,18 C40,18 44,22 44,30 L43,44 L17,44 Z" fill="#0F172A" />
              <!-- 全景玻璃天幕车顶 -->
              <rect x="18" y="47" width="24" height="24" rx="3" fill="#1E293B" stroke="#334155" stroke-width="0.8" />
              <!-- 后挡风玻璃 -->
              <path d="M17,74 L43,74 L42,86 C40,90 36,92 30,92 C24,92 20,90 18,86 Z" fill="#0F172A" />
              <!-- 前大灯光芒 -->
              <polygon points="12,16 16,10 20,15" fill="#38BDF8" opacity="0.9" />
              <polygon points="48,16 44,10 40,15" fill="#38BDF8" opacity="0.9" />
              <!-- 尾灯璀璨红光 -->
              <path d="M12,94 Q30,100 48,94" stroke="#EF4444" stroke-width="3" fill="none" stroke-linecap="round" />
            </svg>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      if (allLatLngs.length > 0) {
        const carMarker = L.marker(allLatLngs[0], { icon: carIcon, zIndexOffset: 1000 }).addTo(map);
        carMarkerRef.current = carMarker;
        map.fitBounds(plannedLine.getBounds(), { padding: [60, 60], maxZoom: 16 });
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
  // 核心动画调度循环 (requestAnimationFrame 高帧率平滑插值)
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

      // 根据倍速换算步进点数 (基准每秒走 15 个采样点)
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

        // 更新地图渲染
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

  // 更新车身位置、车头角度与已过路径
  const updateCarAndPolyline = useCallback(
    (floorIdx: number, subT: number) => {
      if (!mapInstanceRef.current || activeTrajectoryPoints.length === 0) return;
      const pt1 = activeTrajectoryPoints[floorIdx];
      const pt2 = activeTrajectoryPoints[Math.min(floorIdx + 1, activeTrajectoryPoints.length - 1)];

      if (!pt1) return;

      // 经纬度平滑线性插值
      const curLat = pt1.lat + (pt2.lat - pt1.lat) * subT;
      const curLng = pt1.lng + (pt2.lng - pt1.lng) * subT;

      // 计算车头朝向旋转角
      const bearing = calculateBearing(pt1.lat, pt1.lng, pt2.lat, pt2.lng);

      // 移动车标 Marker
      if (carMarkerRef.current) {
        carMarkerRef.current.setLatLng([curLat, curLng]);
        const carEl = document.getElementById('car-vehicle-wrapper');
        if (carEl) {
          carEl.style.transform = `rotate(${Math.round(bearing)}deg)`;
        }
      }

      // 动态更新已驶过的轨迹线
      if (passedPolylineRef.current) {
        const passedCoords: [number, number][] = [];
        for (let i = 0; i <= floorIdx; i++) {
          passedCoords.push([activeTrajectoryPoints[i].lat, activeTrajectoryPoints[i].lng]);
        }
        passedCoords.push([curLat, curLng]);
        passedPolylineRef.current.setLatLngs(passedCoords);
      }

      // 追焦跟随模式：平滑镜头平移
      if (followCar && mapInstanceRef.current) {
        mapInstanceRef.current.panTo([curLat, curLng], { animate: false });
      }
    },
    [activeTrajectoryPoints, followCar]
  );

  // 进度条拖拽控制
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
    <div className="fixed inset-0 z-50 flex bg-black/95 text-white backdrop-blur-xl select-none overflow-hidden animate-in fade-in duration-200">
      {/* ========================================================= */}
      {/* 1. 地图核心主舞台 (全屏/3D 透视) */}
      {/* ========================================================= */}
      <div className="relative flex-1 h-full w-full overflow-hidden bg-zinc-950 flex flex-col">
        {/* 3D 倾斜视图包装容器 */}
        <div
          className={`w-full h-full transition-transform duration-700 ease-out origin-bottom ${
            is3DMode ? 'scale-[1.05]' : ''
          }`}
          style={
            is3DMode
              ? {
                  perspective: '1000px',
                  transform: 'rotateX(36deg) scale(1.08)',
                  transformStyle: 'preserve-3d',
                }
              : undefined
          }
        >
          <div ref={mapContainerRef} className="w-full h-full bg-zinc-950" />
        </div>

        {/* ========================================================= */}
        {/* 2. 悬浮 HUD 仪表盘与极客驾驶数据 (录屏高光) */}
        {/* ========================================================= */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-3">
          {/* 时速表与能量卡片 */}
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 p-4 rounded-3xl shadow-2xl flex items-center gap-5 pointer-events-auto">
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
                  {currentPoint ? currentPoint.speed : 0}
                </span>
                <span className="text-xs font-semibold text-zinc-400">km/h</span>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">SPEED</span>
            </div>

            <div className="h-10 w-px bg-zinc-700/60" />

            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2">
                <Battery className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-zinc-100">
                  {currentPoint ? `${currentPoint.battery}%` : '--'}
                </span>
                <span className="text-[10px] text-zinc-500">电量</span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-zinc-100">
                  {(parseFloat(selectedStats.distance) * progressRatio).toFixed(1)} / {selectedStats.distance} km
                </span>
              </div>
            </div>
          </div>

          {/* 正在行驶路段与时间 */}
          {currentDrive && (
            <div className="bg-zinc-900/75 backdrop-blur-md border border-zinc-800 px-4 py-2.5 rounded-2xl shadow-xl flex flex-col gap-1 max-w-sm pointer-events-auto">
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>{currentPoint ? currentPoint.time.replace('T', ' ').slice(0, 19) : ''}</span>
              </div>
              <div className="text-xs font-semibold text-zinc-200 truncate flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{currentDrive.start_address}</span>
                <span className="text-zinc-500 text-[10px]">➔</span>
                <span className="truncate">{currentDrive.end_address}</span>
              </div>
            </div>
          )}
        </div>

        {/* 顶部右侧：纯净录屏模式指示 / 退出全屏 / 关闭 */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {/* 纯净录屏模式开关 */}
          <button
            onClick={() => setIsCleanRecordMode(!isCleanRecordMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-xl backdrop-blur-md border ${
              isCleanRecordMode
                ? 'bg-red-500/20 text-red-400 border-red-500/40 ring-2 ring-red-500/30'
                : 'bg-zinc-900/80 text-zinc-200 border-zinc-700/60 hover:bg-zinc-800'
            }`}
          >
            <Video className={`w-3.5 h-3.5 ${isCleanRecordMode ? 'animate-pulse text-red-500' : ''}`} />
            <span>{isCleanRecordMode ? '正在录屏 (点击退出)' : '录屏纯净模式'}</span>
          </button>

          {/* 抽屉面板收放按钮 */}
          {!isCleanRecordMode && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 transition-all shadow-xl backdrop-blur-md"
              title={isSidebarOpen ? '收起行程列表' : '展开行程列表'}
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

          {/* 关闭弹窗 */}
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-zinc-900/80 hover:bg-red-500/20 hover:text-red-400 border border-zinc-700/60 text-zinc-400 transition-all shadow-xl backdrop-blur-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* 3. 底部悬浮控制台 (播放、调速、视角、进度条) */}
        {/* ========================================================= */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-2xl bg-zinc-900/85 backdrop-blur-xl border border-zinc-700/60 p-4 rounded-3xl shadow-2xl flex flex-col gap-3">
          {/* 进度条与时间流 */}
          <div className="flex items-center gap-3 w-full">
            <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">
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
            <span className="text-[11px] font-mono text-zinc-400 w-12">
              {selectedStats.distance} km
            </span>
          </div>

          {/* 播放控制按钮群 */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
            {/* 播放 / 暂停 / 重播 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-2xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all shadow-lg shadow-red-600/30"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>

              <button
                onClick={resetPlayback}
                className="p-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="重新从头开始"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* 倍速调节 */}
            <div className="flex items-center bg-zinc-950/60 p-1 rounded-2xl border border-zinc-800 text-xs">
              {[1, 2, 5, 10, 20].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                    playbackSpeed === spd
                      ? 'bg-red-500 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* 视角切换 (3D倾角 + 追焦跟随) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIs3DMode(!is3DMode)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  is3DMode
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>3D俯仰</span>
              </button>

              <button
                onClick={() => setFollowCar(!followCar)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  followCar
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>镜头跟随</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. 右侧行程管理与自定义剔除面板 (录屏纯净模式下自动隐藏) */}
      {/* ========================================================= */}
      {!isCleanRecordMode && isSidebarOpen && (
        <div className="w-80 md:w-96 h-full bg-zinc-950 border-l border-zinc-800 flex flex-col shrink-0 z-30 animate-in slide-in-from-right duration-200 shadow-2xl">
          {/* 头部：天数筛选与操作 */}
          <div className="p-4 border-b border-zinc-800/80 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <h2 className="text-sm font-bold text-white">回放行程定制</h2>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                已选 {selectedStats.count} / {drives.length} 段
              </span>
            </div>

            {/* 最近天数滑块与选择 */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">最近时间跨度:</span>
                <span className="font-bold text-red-400 font-mono">最近 {days} 天</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 3, 5, 7, 10].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDays(d);
                      fetchDrivesData(d);
                      resetPlayback();
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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

            {/* 智能过滤与全选辅助按钮 */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={filterShortTrips}
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-all"
                title="自动取消勾选距离 < 1km 或耗时 < 3分钟的挪车行程"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>过滤短途挪车</span>
              </button>

              <button
                onClick={toggleSelectAll}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium transition-all"
              >
                {selectedDriveIds.size === drives.length ? '全不选' : '全选'}
              </button>
            </div>
          </div>

          {/* 行程列表卡片滚动区 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-transparent">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-xs gap-2">
                <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <span>正在提取高精轨迹数据...</span>
              </div>
            ) : drives.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 text-xs">
                所选时间内未发现行程记录
              </div>
            ) : (
              drives.map((drive) => {
                const isChecked = selectedDriveIds.has(drive.id);
                const isShort = (drive.distance || 0) < 1.0;

                return (
                  <div
                    key={drive.id}
                    onClick={() => toggleDriveSelection(drive.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isChecked
                        ? 'bg-zinc-900/90 border-red-500/40 shadow-sm'
                        : 'bg-zinc-950/60 border-zinc-900 text-zinc-500 hover:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-red-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-600 shrink-0" />
                        )}
                        <span className="text-xs font-mono font-medium text-zinc-300">
                          {drive.start_date.slice(5, 16).replace('T', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isShort && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            挪车
                          </span>
                        )}
                        <span className="text-xs font-bold text-zinc-200">
                          {drive.distance} km
                        </span>
                      </div>
                    </div>

                    {/* 地点信息 */}
                    <div className="text-xs text-zinc-400 pl-6 flex flex-col gap-0.5">
                      <div className="truncate text-zinc-300">
                        {drive.start_address || '起点未知'}
                      </div>
                      <div className="truncate text-zinc-400 text-[11px]">
                        ➔ {drive.end_address || '终点未知'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pl-6 pt-1 border-t border-zinc-900">
                      <span>耗时 {drive.duration_min} 分钟</span>
                      <span>均速 {drive.speed_avg} km/h</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 底部确认栏 */}
          <div className="p-4 border-t border-zinc-800/80 bg-zinc-950 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>合计里程:</span>
              <span className="font-bold text-white font-mono text-sm">{selectedStats.distance} km</span>
            </div>
            <button
              onClick={() => {
                resetPlayback();
                setIsPlaying(true);
              }}
              disabled={selectedStats.count === 0}
              className="w-full py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>立即回放选中路线</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
