'use client';

import { useEffect, useState } from 'react';
import { getClassScheduleAction } from '@/modules/classes/controller/schedule.action';

export default function ClassScheduleBadge({ classId }: { classId: number }) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSchedule() {
      const res = await getClassScheduleAction(classId);
      if (res.success) setSchedules(res.data);
      setIsLoading(false);
    }
    loadSchedule();
  }, [classId]);

  if (isLoading) return <div className="mt-4 flex gap-2 animate-pulse"><div className="h-6 w-16 bg-slate-700/50 rounded"></div></div>;
  if (schedules.length === 0) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <span className="flex items-center gap-1 bg-slate-500/10 text-slate-400 text-xs font-bold px-2.5 py-1 rounded-md border border-slate-500/20 shadow-sm">
          📅 Chưa xếp lịch
        </span>
      </div>
    );
  }

  const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  // 🎯 Hàm xử lý format thời gian an toàn
  const formatTimeSafely = (timeStr: any) => {
    if (!timeStr) return '--:--';
    if (typeof timeStr === 'string') return timeStr.substring(0, 5);
    return String(timeStr);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {schedules.map((s) => (
        <span 
          key={s.schedule_id} 
          className="flex items-center gap-1 bg-sky-500/10 text-sky-400 text-xs font-bold px-2.5 py-1 rounded-md border border-sky-500/20 shadow-sm"
          title={`Phòng: ${s.room || 'Chưa xếp'}`}
        >
          {/* 🎯 Đã cập nhật để hiển thị cả Giờ bắt đầu và Giờ kết thúc */}
          🕒 {days[s.day_of_week - 1]} ({formatTimeSafely(s.start_time)} - {formatTimeSafely(s.end_time)})
        </span>
      ))}
    </div>
  );
}