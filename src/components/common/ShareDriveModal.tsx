'use client';

import React, { useRef, useState, useEffect } from 'react';
import { DriveDetail } from '@/types';
import {
  formatDistance,
  formatDuration,
  formatEnergy,
  formatDateTime,
} from '@/lib/formatters';
import { toPng } from 'html-to-image';
import {
  X,
  Copy,
  Check,
  Route,
  Image as ImageIcon,
  Loader2,
  Eye,
  EyeOff,
  Compass,
} from 'lucide-react';
import { wgs84ToGcj02 } from '@/lib/coordtransform';

interface ShareDriveModalProps {
  drive: DriveDetail;
  carName?: string;
  isOpen: boolean;
  onClose: () => void;
}

// 经纬度转墨卡托切片坐标
function lngLatToTile(lng: number, lat: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

// 墨卡托切片坐标转经纬度 (左上角)
function tileToLngLat(x: number, y: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const lng = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

// 隐私打码函数
function maskAddress(addr: string): string {
  if (!addr) return '******';
  if (addr.includes('·')) {
    const parts = addr.split('·');
    return `${parts[0].trim()} · ****** (已脱敏)`;
  }
  if (addr.includes('(')) {
    const parts = addr.split('(');
    return `${parts[0].trim()} (已脱敏)`;
  }
  if (addr.length <= 4) return '****** (已脱敏)';
  return `${addr.substring(0, 3)}****** (已脱敏)`;
}

// 兼容 HTTP 与 HTTPS 的安全剪贴板复制工具
async function safeCopyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return false;
  }
}

export function ShareDriveModal({
  drive,
  carName = 'My Tesla',
  isOpen,
  onClose,
}: ShareDriveModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedImgUrl, setGeneratedImgUrl] = useState<string | null>(null);

  // 异步在 Canvas 上绘制地图底图与轨迹
  const drawTrackMap = async (isPrivacy: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas || !drive.positions || drive.positions.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = 2;
    const width = 360;
    const height = 190;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 1. 转换全部点为 GCJ-02 坐标
    const points: [number, number][] = drive.positions.map((p) => {
      const [gcjLng, gcjLat] = wgs84ToGcj02(p.longitude, p.latitude);
      return [gcjLat, gcjLng];
    });

    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;
    points.forEach(([lat, lng]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latSpan = Math.max(0.005, maxLat - minLat);
    const lngSpan = Math.max(0.005, maxLng - minLng);

    // 2. 模式区分
    if (isPrivacy) {
      // 🛡️ 隐私模式：深空纯黑背景 + 仅纯净轨迹
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      // 微弱科技网格
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      for (let x = 20; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 20; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(59,130,246,0.15)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('🛡️ 隐私模式 · 地理信息已隐藏', width - 12, height - 12);
    } else {
      // 🗺️ 非隐私模式：加载并绘制真实高德暗色矢量地图切片
      ctx.fillStyle = '#141416';
      ctx.fillRect(0, 0, width, height);

      // 计算自适应 zoom 级别 (12~14)
      const maxSpan = Math.max(latSpan, lngSpan);
      let zoom = 13;
      if (maxSpan < 0.03) zoom = 14;
      else if (maxSpan < 0.08) zoom = 13;
      else zoom = 12;

      const centerTile = lngLatToTile(centerLng, centerLat, zoom);

      // 加载周围 3x2 块高德暗色瓦片
      const tilePromises: Promise<{ img: HTMLImageElement; dx: number; dy: number } | null>[] = [];

      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const tx = centerTile.x + ox;
          const ty = centerTile.y + oy;
          const tileNW = tileToLngLat(tx, ty, zoom);
          const tileSE = tileToLngLat(tx + 1, ty + 1, zoom);

          const sub = (Math.abs(tx + ty) % 4) + 1;
          const url = `https://webrd0${sub}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x=${tx}&y=${ty}&z=${zoom}`;

          const p = new Promise<{ img: HTMLImageElement; dx: number; dy: number } | null>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              // 计算该瓦片在 Canvas 视口中的像素位置
              const x0 = ((tileNW.lng - centerLng) / (lngSpan * 1.5)) * width + width / 2;
              const y0 = ((centerLat - tileNW.lat) / (latSpan * 1.5)) * height + height / 2;
              const x1 = ((tileSE.lng - centerLng) / (lngSpan * 1.5)) * width + width / 2;
              const y1 = ((centerLat - tileSE.lat) / (latSpan * 1.5)) * height + height / 2;
              resolve({ img, dx: x0, dy: y0 });
            };
            img.onerror = () => resolve(null);
            img.src = url;
          });

          tilePromises.push(p);
        }
      }

      // 等待瓦片加载完成 (设置 800ms 超时)
      const timeoutPromise = new Promise<null>((r) => setTimeout(() => r(null), 800));
      const loadedTiles = await Promise.race([Promise.all(tilePromises), timeoutPromise]);

      if (Array.isArray(loadedTiles)) {
        loadedTiles.forEach((item) => {
          if (item && item.img) {
            ctx.drawImage(item.img, item.dx, item.dy, 256, 256);
          }
        });
      }

      // 加一层微弱暗黑渐变蒙版，让红线更突出
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);

      // 高德地图水印标
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('高德地图 · 高精路线', width - 10, height - 10);
    }

    // 3. 投影经纬度到 Canvas 像素并绘制行车轨迹
    const padding = 28;
    const drawW = width - padding * 2;
    const drawH = height - padding * 2;

    const projectedPoints = points.map(([lat, lng]) => {
      const x = padding + ((lng - minLng) / lngSpan) * drawW;
      const y = height - padding - ((lat - minLat) / latSpan) * drawH;
      return [x, y];
    });

    // 绘制轨迹红色发光外晕
    ctx.save();
    ctx.beginPath();
    projectedPoints.forEach(([x, y], idx) => {
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();

    // 绘制主轨迹
    ctx.beginPath();
    projectedPoints.forEach(([x, y], idx) => {
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // 绘制起点（绿色发光）与终点（红色发光）
    if (projectedPoints.length > 0) {
      const [startX, startY] = projectedPoints[0];
      const [endX, endY] = projectedPoints[projectedPoints.length - 1];

      // 起点
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(startX, startY, 5, 0, Math.PI * 2);
      ctx.fill();

      // 终点
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(endX, endY, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // 生成海报高清图片
  const generatePosterImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      await drawTrackMap(privacyMode);

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3, // 3倍超高清输出
        quality: 0.95,
      });

      setGeneratedImgUrl(dataUrl);
    } catch (err) {
      console.error('渲染海报图片失败:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 打开弹窗或隐私模式变化时，自动重绘并生成
  useEffect(() => {
    if (!isOpen) {
      setGeneratedImgUrl(null);
      return;
    }

    let isMounted = true;
    setGeneratedImgUrl(null); // 切换模式时先重置，触发重新渲染
    const timer = setTimeout(async () => {
      if (isMounted) {
        await generatePosterImage();
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, privacyMode]);

  if (!isOpen) return null;

  const singleTripCost = (drive.consumption_kwh * 0.311).toFixed(2);
  const displayStartAddr = privacyMode ? maskAddress(drive.start_address) : drive.start_address;
  const displayEndAddr = privacyMode ? maskAddress(drive.end_address) : drive.end_address;

  // 复制行程文字战报
  const handleCopyText = async () => {
    const text = `🚗【${carName} · 单次行程战报】
📍 行驶里程: ${formatDistance(drive.distance)}
⏱️ 行车耗时: ${formatDuration(drive.duration_min)} (均速 ${Math.round(drive.speed_avg)} km/h)
🔋 电量消耗: ${drive.start_battery_level}% ➔ ${drive.end_battery_level}% (${formatEnergy(drive.consumption_kwh)})
🌿 综合能耗: ${drive.efficiency_wh_km} Wh/km (单次电费仅 ¥${singleTripCost})
🏁 路线: ${displayStartAddr} ➔ ${displayEndAddr}
✨ 由 TeslaMate CN 专属生成。`;

    const ok = await safeCopyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-4 shadow-2xl flex flex-col max-h-[94vh] overflow-y-auto">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900 border border-zinc-800 z-20 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 顶部操作区：隐私模式切换与保存提示 */}
        <div className="mb-3 pr-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-300">
            <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-medium">
              {isGenerating ? '正在生成海报...' : '📱 长按图片存储到相册'}
            </span>
          </div>

          {/* 🌟 隐私模式一键切换 */}
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
              privacyMode
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-sm shadow-blue-500/20'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {privacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{privacyMode ? '隐私模式：已开启' : '开启隐私模式'}</span>
          </button>
        </div>

        {/* 🌟 海报图片容器 (彻底杜绝任何 link.click() 跳转) */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl bg-zinc-900">
          {generatedImgUrl ? (
            <img
              src={generatedImgUrl}
              alt="行程海报"
              className="w-full h-auto block select-auto pointer-events-auto"
            />
          ) : (
            /* 用于初次渲染绘制的基础海报 DOM */
            <div
              ref={cardRef}
              className="p-5 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 text-white space-y-3.5"
            >
              {/* 1. 顶栏品牌 */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white shadow-md shadow-red-600/30">
                    <span className="text-base tracking-tighter">T</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold tracking-tight text-white">{carName}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">Model Y · 行程全览</div>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {formatDateTime(drive.start_date)}
                </span>
              </div>

              {/* 2. 核心大里程与能效概览 */}
              <div className="text-center py-2 bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-3">
                <div className="text-[11px] text-zinc-400 flex items-center justify-center gap-1">
                  <Route className="w-3.5 h-3.5 text-blue-400" />
                  <span>本次行驶里程</span>
                </div>
                <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300 mt-0.5">
                  {formatDistance(drive.distance)}
                </div>
                <div className="text-[10px] text-zinc-400 mt-1 flex items-center justify-center gap-2">
                  <span>耗时 {formatDuration(drive.duration_min)}</span>
                  <span>•</span>
                  <span>均速 {Math.round(drive.speed_avg)} km/h</span>
                </div>
              </div>

              {/* 3. 🗺️ 行车轨迹地图 (普通模式展示高德底图，隐私模式纯黑无地标) */}
              <div className="rounded-xl overflow-hidden border border-zinc-800/80 shadow-md relative bg-zinc-950">
                <canvas
                  ref={canvasRef}
                  style={{ width: '100%', height: '170px' }}
                  className="block"
                />
                <div className="absolute bottom-2 left-2.5 text-[9px] text-zinc-400 font-mono flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  <Compass className="w-3 h-3 text-red-500" />
                  <span>
                    {privacyMode ? '🛡️ 纯净轨迹 (已隐藏现实地标)' : '高德暗色高精图层'}
                  </span>
                </div>
              </div>

              {/* 4. 起止路线 (隐私模式下严格打码) */}
              <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-2.5 text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                  <div className="truncate text-zinc-300">
                    <span className="text-zinc-500 mr-1">起:</span>
                    <span className={privacyMode ? 'font-mono text-zinc-400' : ''}>
                      {displayStartAddr}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  <div className="truncate text-zinc-300">
                    <span className="text-zinc-500 mr-1">终:</span>
                    <span className={privacyMode ? 'font-mono text-zinc-400' : ''}>
                      {displayEndAddr}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. 4 维核心能耗网格 */}
              <div className="grid grid-cols-2 gap-2 text-left text-xs">
                <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-400">百公里平均能耗</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {drive.efficiency_wh_km} <span className="text-[10px] font-normal text-zinc-400">Wh/km</span>
                  </div>
                  <div className="text-[9px] text-zinc-500 mt-0.5">能效优于 95% 车友</div>
                </div>

                <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-400">电量消耗与费用</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {drive.start_battery_level}% ➔ {drive.end_battery_level}%
                  </div>
                  <div className="text-[9px] text-zinc-400 mt-0.5">
                    耗电 {formatEnergy(drive.consumption_kwh)} · 仅 ¥{singleTripCost}
                  </div>
                </div>
              </div>

              {/* 6. 底部品牌与签名 */}
              <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/60">
                <span className="font-mono">TeslaMate CN 数据中心</span>
                <span>⚡ 极佳能效</span>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              <span>正在生成高清海报...</span>
            </div>
          )}
        </div>

        {/* 底部复制文字战报栏 */}
        <div className="mt-3.5 flex items-center gap-2">
          <button
            onClick={handleCopyText}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium text-xs border border-zinc-700 transition-all active:scale-95 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制文字战报' : '复制文字战报'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
