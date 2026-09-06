'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CarMilestonesData, CarMilestone } from '@/types';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Sparkles, 
  ChevronRight, 
  Edit3, 
  Target, 
  TrendingUp,
  Check,
  X,
  Compass
} from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';

interface CarMilestonesCardProps {
  initialData: CarMilestonesData;
}

export function CarMilestonesCard({ initialData }: CarMilestonesCardProps) {
  const [data, setData] = useState<CarMilestonesData>(initialData);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [inputDate, setInputDate] = useState(initialData.delivery_date);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // 保存提车日期
  const handleSaveDeliveryDate = async () => {
    if (!inputDate) return;
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch('/api/car/delivery-date/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_id: data.car_id,
          delivery_date: inputDate,
        }),
      });

      const json = await res.json();
      if (json.success) {
        // 动态重新计算本地天数与预测
        const deliveryTime = new Date(`${inputDate}T00:00:00+08:00`).getTime();
        const nowTime = Date.now();
        const newDays = Math.max(1, Math.round((nowTime - deliveryTime) / (1000 * 60 * 60 * 24)));
        const newDailyAvg = Number((data.current_odometer / newDays).toFixed(1));

        const updatedMilestones: CarMilestone[] = data.milestones.map((m) => {
          if (m.is_achieved && m.achieved_date) {
            const hitTime = new Date(m.achieved_date).getTime();
            const durationMs = Math.max(0, hitTime - deliveryTime);
            const totalHours = Math.floor(durationMs / (1000 * 60 * 60));
            const days = Math.floor(totalHours / 24);
            const hours = totalHours % 24;
            return {
              ...m,
              achieved_duration_days: days,
              achieved_duration_hours: hours,
              achieved_duration_text: `历时 ${days} 天 ${hours} 小时`,
            };
          } else if (!m.is_achieved) {
            const remainingKm = Number((m.target_km - data.current_odometer).toFixed(1));
            const effectiveDaily = Math.max(5, newDailyAvg);
            const predictedDays = Math.round(remainingKm / effectiveDaily);
            const predDate = new Date(nowTime + predictedDays * 86400000).toISOString().split('T')[0];
            return {
              ...m,
              predicted_days_remaining: predictedDays,
              predicted_date: predDate,
            };
          }
          return m;
        });

        setData({
          ...data,
          delivery_date: inputDate,
          days_since_delivery: newDays,
          daily_avg_km: newDailyAvg,
          milestones: updatedMilestones,
        });

        setSaveMessage('提车日期已同步至车辆！');
        setTimeout(() => {
          setIsEditingDate(false);
          setSaveMessage(null);
        }, 1200);
      } else {
        alert(json.error || '保存失败');
      }
    } catch (e) {
      alert('网络异常，保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const achievedCount = data.milestones.filter((m) => m.is_achieved).length;

  return (
    <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden">
      {/* 顶部背景高光饰条 */}
      <div className="absolute top-0 right-0 w-80 h-40 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* 卡片头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                <span>爱车里程碑与提车成就</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  已达成 {achievedCount} / {data.milestones.length}
                </span>
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              记录每 1,000 km、5,000 km、10,000 km 等关键成长节点与智能预测
            </p>
          </div>
        </div>

        {/* 提车日期设置按钮 */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsEditingDate(true)}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-800/90 hover:bg-zinc-750 px-3.5 py-1.5 rounded-xl border border-zinc-700/80 transition-all active:scale-95 shadow-sm group"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>提车日: {data.delivery_date}</span>
            <Edit3 className="w-3 h-3 text-zinc-400 ml-0.5" />
          </button>
        </div>
      </div>

      {/* 📅 提车日期修改专属模态弹窗 (Modal) */}
      {isEditingDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">修改爱车提车日期</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">将写入车辆数据库，多端设备跨浏览器实时同步</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingDate(false)}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-medium text-zinc-300">
                选择提车日期
              </label>
              <input
                type="date"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch {}
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors [color-scheme:dark] cursor-pointer"
              />

              {/* 快捷选择标签 */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-zinc-500 text-[11px]">快捷选择:</span>
                <button
                  type="button"
                  onClick={() => setInputDate('2026-08-16')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700/60"
                >
                  2026-08-16 (默认)
                </button>
                <button
                  type="button"
                  onClick={() => setInputDate(new Date().toISOString().split('T')[0])}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700/60"
                >
                  今天
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setIsEditingDate(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveDeliveryDate}
                disabled={isSaving || !inputDate}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                {isSaving ? '正在保存...' : '确认保存并同步'}
              </button>
            </div>
          </div>
        </div>
      )}

      {saveMessage && (
        <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          {saveMessage}
        </div>
      )}

      {/* 提车总况核心速览栏 */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs bg-zinc-950/50 p-2.5 rounded-2xl border border-zinc-800/80">
        <div>
          <div className="text-[11px] text-zinc-400">提车至今</div>
          <div className="text-sm font-bold text-white mt-0.5">
            {data.days_since_delivery} <span className="text-[10px] text-zinc-400 font-normal">天</span>
          </div>
        </div>
        <div className="border-x border-zinc-800/80">
          <div className="text-[11px] text-zinc-400">当前总里程</div>
          <div className="text-sm font-bold text-amber-400 mt-0.5">
            {data.current_odometer.toLocaleString('zh-CN')} <span className="text-[10px] text-zinc-400 font-normal">km</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] text-zinc-400">日均行驶</div>
          <div className="text-sm font-bold text-blue-400 mt-0.5">
            {data.daily_avg_km} <span className="text-[10px] text-zinc-400 font-normal">km/天</span>
          </div>
        </div>
      </div>

      {/* 里程碑梯级列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {data.milestones.map((m) => {
          if (m.is_achieved) {
            // 已达成勋章卡片
            return (
              <div
                key={m.target_km}
                className="bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group"
              >
                {/* 达成金色光晕 */}
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{m.label}</div>
                      <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>已达成 · {m.achieved_duration_text}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    达成
                  </span>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <div className="text-zinc-400 text-[11px]">
                    达成时刻: <span className="text-zinc-300">{m.achieved_date ? formatDateTime(m.achieved_date) : '提车近期'}</span>
                  </div>
                  {m.drive_id && (
                    <Link
                      href={`/drives/${m.drive_id}`}
                      className="text-amber-400 hover:text-amber-300 font-medium text-[11px] flex items-center gap-0.5 transition-colors"
                    >
                      <span>回看行程</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          }

          // 未达成进度卡片
          return (
            <div
              key={m.target_km}
              className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-zinc-800/80 text-zinc-400">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-300">{m.label}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        还差 {m.remaining_km?.toLocaleString('zh-CN')} km
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                    {m.current_progress_percent}%
                  </span>
                </div>

                {/* 进度条 */}
                <div className="mt-3 w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${m.current_progress_percent}%` }}
                  />
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span>预计还需 {m.predicted_days_remaining} 天</span>
                </div>
                <div className="text-zinc-500">
                  约 {m.predicted_date} 达成
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
