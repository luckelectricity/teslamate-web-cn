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
  const [showFullWallModal, setShowFullWallModal] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [inputDate, setInputDate] = useState(initialData.delivery_date);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // 获取最新已达成的一个成就和下一个待达成目标
  const achievedList = data.milestones.filter((m) => m.is_achieved);
  const latestAchieved = achievedList[achievedList.length - 1] || data.milestones[0];
  const nextTarget = data.milestones.find((m) => !m.is_achieved);

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
              remaining_km: remainingKm,
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

  return (
    <>
      {/* 🌟 1. 统计页外露精简胶囊 (只展示当前完成的成就，不堆叠霸屏) */}
      <div className="cyber-card rounded-2xl p-3.5 sm:p-4 shadow-lg border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-white truncate">
                🎉 {latestAchieved.label}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                已达成
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              {latestAchieved.achieved_duration_text && (
                <span>{latestAchieved.achieved_duration_text}</span>
              )}
              {nextTarget && (
                <span className="text-zinc-500">
                  · 下一目标 {nextTarget.label.split(' ')[0]} 还差 {(nextTarget.target_km - data.current_odometer).toFixed(1)} km
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 二级入口按钮 */}
        <button
          onClick={() => setShowFullWallModal(true)}
          className="shrink-0 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-all flex items-center gap-1 active:scale-95"
        >
          <span>成就墙与预测</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 🌟 2. 二级成就墙完整弹窗 (点击入口后弹出，包含全部里程碑、提车日、预测) */}
      {showFullWallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>爱车里程碑成就墙</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      已达成 {achievedList.length} / {data.milestones.length}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">记录提车成长旅程与未来里程碑智能测算</p>
                </div>
              </div>
              <button
                onClick={() => setShowFullWallModal(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 提车速览栏 */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
              <div>
                <div className="text-[11px] text-zinc-400">提车至今</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {data.days_since_delivery} <span className="text-[10px] text-zinc-500">天</span>
                </div>
              </div>
              <div className="border-x border-zinc-800/80">
                <div className="text-[11px] text-zinc-400">当前总里程</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">
                  {data.current_odometer.toLocaleString('zh-CN')} <span className="text-[10px] text-zinc-500">km</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-400">日均行驶</div>
                <div className="text-sm font-bold text-blue-400 mt-0.5">
                  {data.daily_avg_km} <span className="text-[10px] text-zinc-500">km/天</span>
                </div>
              </div>
            </div>

            {/* 提车日期设置 */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/40 border border-zinc-800 text-xs">
              <span className="text-zinc-400">提车日期: <strong className="text-white">{data.delivery_date}</strong></span>
              <button
                onClick={() => setIsEditingDate(true)}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>修改提车日</span>
              </button>
            </div>

            {/* 修改提车日微弹窗 */}
            {isEditingDate && (
              <div className="p-3.5 rounded-2xl bg-zinc-800/90 border border-amber-500/40 space-y-2.5">
                <div className="text-xs font-semibold text-white">选择您的实际提车日期</div>
                <input
                  type="date"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white [color-scheme:dark]"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsEditingDate(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveDeliveryDate}
                    disabled={isSaving}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-500 hover:bg-amber-400 shadow-md"
                  >
                    {isSaving ? '保存中...' : '确认同步'}
                  </button>
                </div>
              </div>
            )}

            {/* 完整的全部里程碑卡片流 */}
            <div className="space-y-2.5 pt-1">
              {data.milestones.map((m) => (
                <div
                  key={m.target_km}
                  className={`p-3.5 rounded-2xl border transition-all text-xs ${
                    m.is_achieved
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-zinc-950/50 border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-xl ${m.is_achieved ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-500'}`}>
                        {m.is_achieved ? <CheckCircle2 className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                      </div>
                      <span className="font-bold text-white text-xs sm:text-sm">{m.label}</span>
                    </div>
                    {m.is_achieved ? (
                      <span className="text-[11px] font-semibold text-amber-400">
                        {m.achieved_duration_text || '已达成'}
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400">
                        还差 {m.remaining_km} km
                      </span>
                    )}
                  </div>

                  {!m.is_achieved && (
                    <div className="mt-2.5 space-y-1.5">
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${m.current_progress_percent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span>进度: {m.current_progress_percent}%</span>
                        {m.predicted_date && (
                          <span>预计于 {m.predicted_date} 达成 (约 {m.predicted_days_remaining} 天后)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
