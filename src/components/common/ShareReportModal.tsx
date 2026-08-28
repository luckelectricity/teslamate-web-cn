'use client';

import React, { useRef, useState, useEffect } from 'react';
import { MonthlyReport } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { toPng } from 'html-to-image';
import { X, Copy, Check, Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ShareReportModalProps {
  report: MonthlyReport;
  carName?: string;
  isOpen: boolean;
  onClose: () => void;
}

// 兼容 HTTP 局域网与 HTTPS 的安全剪贴板复制工具
async function safeCopyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 继续 fallback
    }
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

export function ShareReportModal({
  report,
  carName = 'My Tesla',
  isOpen,
  onClose,
}: ShareReportModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedImgUrl, setGeneratedImgUrl] = useState<string | null>(null);

  // 打开弹窗时自动渲染生成高清图片
  useEffect(() => {
    if (!isOpen) {
      setGeneratedImgUrl(null);
      return;
    }

    let isMounted = true;
    // 延迟 100ms 等待 DOM 完全渲染
    const timer = setTimeout(async () => {
      if (cardRef.current && isMounted) {
        try {
          setIsGenerating(true);
          const dataUrl = await toPng(cardRef.current, {
            cacheBust: true,
            pixelRatio: 3, // 3倍超高清输出
            quality: 0.95,
          });
          if (isMounted) {
            setGeneratedImgUrl(dataUrl);
          }
        } catch (err) {
          console.error('自动渲染海报图片失败:', err);
        } finally {
          if (isMounted) setIsGenerating(false);
        }
      }
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // 复制文字战报
  const handleCopyText = async () => {
    const text = `🚗【${carName} · ${report.month} 出行月报】
📍 行驶里程: ${report.distance_km} km (${report.drive_count} 次行程)
⚡ 充入电量: ${report.charge_energy_kwh} kWh
💰 家充总电费: ${formatCurrency(report.charge_cost)} (折合 ¥${(report.charge_cost / Math.max(1, report.distance_km)).toFixed(3)}/km)
🌿 综合能耗: ${report.avg_wh_km} Wh/km
⛽ 对比同里程油车净省: ${formatCurrency(report.saved_cost)}！
✨ 由 TeslaMate CN 专属生成。`;

    const ok = await safeCopyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-4 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900 border border-zinc-800 z-20 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 顶部清晰操作提示 (专为 iOS 与 极空间 App 设计) */}
        <div className="mb-3 pr-8 flex items-center gap-2 text-xs text-zinc-300">
          <ImageIcon className="w-4 h-4 text-red-500 shrink-0" />
          <span className="font-medium">
            {isGenerating ? '正在生成高清海报...' : '📱 长按下方图片可「存储到相册」'}
          </span>
        </div>

        {/* 🌟 图片显示区 (彻底杜绝任何 link.click() 跳转) */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl bg-zinc-900">
          {/* 生成好的真实 <img> 供极空间与微信长按保存 */}
          {generatedImgUrl ? (
            <img
              src={generatedImgUrl}
              alt="月度出行海报"
              className="w-full h-auto block select-auto pointer-events-auto"
            />
          ) : (
            /* 用于初次渲染绘制的基础 DOM 节点 */
            <div
              ref={cardRef}
              className="p-5 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 text-white space-y-4"
            >
              {/* 顶栏品牌 */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white shadow-md shadow-red-600/30">
                    <span className="text-base tracking-tighter">T</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold tracking-tight text-white">{carName}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">Model Y · 50 标准版</div>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {report.month} 出行月报
                </span>
              </div>

              {/* 核心亮点主视觉 */}
              <div className="text-center py-2 bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-3">
                <div className="text-xs text-zinc-400 flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>本月对比燃油车已净省</span>
                </div>
                <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 mt-0.5">
                  {formatCurrency(report.saved_cost)}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  实际电费仅为同里程油车费用的 10.5%
                </div>
              </div>

              {/* 4 维关键指标格 */}
              <div className="grid grid-cols-2 gap-2 text-left text-xs">
                <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-400">总行驶里程</div>
                  <div className="text-sm font-bold text-white mt-0.5">{report.distance_km} <span className="text-[10px] font-normal text-zinc-400">km</span></div>
                  <div className="text-[9px] text-zinc-500 mt-0.5">{report.drive_count} 次出行</div>
                </div>

                <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-400">家充总电费</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">{formatCurrency(report.charge_cost)}</div>
                  <div className="text-[9px] text-zinc-500 mt-0.5">充入 {report.charge_energy_kwh} 度电</div>
                </div>

                <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-400">百公里平均能耗</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{report.avg_wh_km} <span className="text-[10px] font-normal text-zinc-400">Wh/km</span></div>
                  <div className="text-[9px] text-zinc-500 mt-0.5">能效优于全国 96% 车友</div>
                </div>

                <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-400">折合每公里电费</div>
                  <div className="text-sm font-bold text-blue-400 mt-0.5">
                    ¥{(report.charge_cost / Math.max(1, report.distance_km)).toFixed(3)}
                  </div>
                  <div className="text-[9px] text-zinc-500 mt-0.5">按 0.311元/度 谷电</div>
                </div>
              </div>

              {/* 底部小签名 */}
              <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/60">
                <span className="font-mono">TeslaMate CN 数据中心</span>
                <span>🌿 绿色低碳出行</span>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-red-500" />
              <span>正在生成高清海报...</span>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
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
