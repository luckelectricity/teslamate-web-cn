import type { Metadata } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { fetchCars } from '@/lib/queries';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { BottomNav } from '@/components/common/BottomNav';
import { DeviceSwitchModal } from '@/components/common/DeviceSwitchModal';

export const metadata: Metadata = {
  title: 'TeslaMate CN | 现代化全平台车况与轨迹可视化看板',
  description: '专为 TeslaMate 打造的现代化、全平台自适应车况管理与轨迹可视化系统',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export const revalidate = 0; // 实时获取最新数据

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cars = await fetchCars();

  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-red-500/30">
        <Header cars={cars} />
        
        <div className="flex w-full">
          {/* PC 宽屏侧边栏 */}
          <Sidebar />

          {/* 主工作区 */}
          <main className="flex-1 w-full p-3 sm:p-6 lg:p-8 min-h-[calc(100vh-3.5rem)]">
            {children}
          </main>
        </div>

        {/* 移动端底部导航栏 */}
        <div className="lg:hidden">
          <BottomNav />
        </div>

        {/* 设备模式自由切换悬浮窗 */}
        <DeviceSwitchModal />
      </body>
    </html>
  );
}
