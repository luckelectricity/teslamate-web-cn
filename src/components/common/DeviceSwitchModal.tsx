'use client';

import React, { useState, useEffect } from 'react';
import { useViewModeStore } from '@/store/useViewModeStore';
import { Smartphone, Monitor, Sparkles, X, Settings2 } from 'lucide-react';

export function DeviceSwitchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { mode, setMode, isMobileLayout, setIsMobileLayout } = useViewModeStore();

  useEffect(() => {
    // 客户端挂载时读取 localStorage / cookie
    const savedMode = localStorage.getItem('teslamate_view_mode') as 'auto' | 'mobile' | 'desktop' | null;
    if (savedMode) {
      setMode(savedMode);
    } else {
      const handleResize = () => {
        setIsMobileLayout(window.innerWidth < 1024);
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [setMode, setIsMobileLayout]);

  return (
    <>
      {/* 悬浮切换按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 flex items-center gap-2 px-3 py-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full border border-zinc-700 shadow-xl backdrop-blur-md transition-all text-xs font-medium"
        title="切换视图模式"
      >
        {mode === 'mobile' ? (
          <Smartphone className="w-4 h-4 text-emerald-400" />
        ) : mode === 'desktop' ? (
          <Monitor className="w-4 h-4 text-blue-400" />
        ) : (
          <Sparkles className="w-4 h-4 text-amber-400" />
        )}
        <span className="hidden sm:inline">
          {mode === 'mobile' ? '手机卡片版' : mode === 'desktop' ? 'PC 宽屏版' : '自适应模式'}
        </span>
      </button>

      {/* 弹窗切换器 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-tesla-blue" />
                <h3 className="text-sm font-semibold text-white">视图呈现模式</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 mt-2 mb-4">
              支持在任意设备（PC / 平板 / 手机）上随时无缝切换专有体验视图。
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setMode('auto');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  mode === 'auto'
                    ? 'bg-zinc-800 border-tesla-blue text-white shadow-lg'
                    : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-amber-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">智能自适应 (默认)</div>
                    <div className="text-xs text-zinc-400">自动根据屏幕尺寸和 UA 推断最适配模式</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setMode('mobile');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  mode === 'mobile'
                    ? 'bg-zinc-800 border-emerald-500 text-white shadow-lg'
                    : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-emerald-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">📱 移动端模式</div>
                    <div className="text-xs text-zinc-400">单列轻量流式卡片、底部导航栏、触控手势优化</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setMode('desktop');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  mode === 'desktop'
                    ? 'bg-zinc-800 border-blue-500 text-white shadow-lg'
                    : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-blue-400">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">🖥️ PC 宽屏模式</div>
                    <div className="text-xs text-zinc-400">多列大仪表盘、宽表与地图联动大看板</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
