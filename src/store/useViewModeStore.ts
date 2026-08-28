import { create } from 'zustand';
import { ViewMode } from '@/types';

interface ViewModeState {
  // 用户偏好：'auto' | 'mobile' | 'desktop'
  mode: ViewMode;
  // 客户端实际渲染状态（根据屏幕宽度或强制设置推导）
  isMobileLayout: boolean;
  setMode: (mode: ViewMode) => void;
  setIsMobileLayout: (isMobile: boolean) => void;
}

export const useViewModeStore = create<ViewModeState>((set, get) => ({
  mode: 'auto',
  isMobileLayout: false,
  setMode: (mode: ViewMode) => {
    set({ mode });
    if (typeof window !== 'undefined') {
      localStorage.setItem('teslamate_view_mode', mode);
      document.cookie = `teslamate_view_mode=${mode}; path=/; max-age=31536000`;
    }
    // 立即更新实际布局计算
    if (mode === 'mobile') {
      set({ isMobileLayout: true });
    } else if (mode === 'desktop') {
      set({ isMobileLayout: false });
    } else if (typeof window !== 'undefined') {
      set({ isMobileLayout: window.innerWidth < 1024 });
    }
  },
  setIsMobileLayout: (isMobile: boolean) => {
    const currentMode = get().mode;
    if (currentMode === 'auto') {
      set({ isMobileLayout: isMobile });
    }
  },
}));
