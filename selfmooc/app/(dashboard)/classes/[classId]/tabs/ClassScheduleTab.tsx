'use client';

import { useEffect, useState } from 'react';
import { addClassScheduleAction, getClassScheduleAction, deleteClassScheduleAction, updateClassScheduleAction } from '@/modules/classes/controller/schedule.action';

export default function ClassScheduleTab({ classId }: { classId: number }) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  const loadSchedule = async () => {
    const res = await getClassScheduleAction(classId);
    if (res.success) setSchedules(res.data);
  };

  useEffect(() => {
    loadSchedule();
  }, [classId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingSchedule(true);
    const fd = new FormData(e.currentTarget);
    let res;
    if (editingSchedule) {
      res = await updateClassScheduleAction(editingSchedule.schedule_id, fd);
    } else {
      res = await addClassScheduleAction(classId, fd);
    }
    
    if (res.success) {
      loadSchedule();
      setEditingSchedule(null); 
      (e.target as HTMLFormElement).reset();
    } else {
      alert(res.message);
    }
    setIsSubmittingSchedule(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* CỘT TRÁI: FORM XẾP LỊCH */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-3xl p-6 border-2 border-indigo-100 sticky top-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2">📅 {editingSchedule ? 'Sửa lịch học' : 'Xếp lịch học'}</span>
            {editingSchedule && (
              <button onClick={() => setEditingSchedule(null)} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg text-gray-600 font-bold transition-colors">Hủy sửa</button>
            )}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Thứ trong tuần</label>
              <select name="day_of_week" defaultValue={editingSchedule?.day_of_week || "1"} key={editingSchedule?.schedule_id || 'new_day'} required className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 font-bold outline-none focus:border-indigo-400 transition-colors">
                <option value="1">Thứ 2</option>
                <option value="2">Thứ 3</option>
                <option value="3">Thứ 4</option>
                <option value="4">Thứ 5</option>
                <option value="5">Thứ 6</option>
                <option value="6">Thứ 7</option>
                <option value="7">Chủ Nhật</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Giờ bắt đầu</label>
                <input type="time" name="start_time" defaultValue={editingSchedule?.start_time} key={editingSchedule?.schedule_id || 'new_start'} required className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 font-bold outline-none focus:border-indigo-400 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Giờ kết thúc</label>
                <input type="time" name="end_time" defaultValue={editingSchedule?.end_time} key={editingSchedule?.schedule_id || 'new_end'} required className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 font-bold outline-none focus:border-indigo-400 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Phòng học (Tùy chọn)</label>
              <input type="text" name="room" defaultValue={editingSchedule?.room} key={editingSchedule?.schedule_id || 'new_room'} placeholder="VD: Phòng 101..." className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 font-bold outline-none focus:border-indigo-400 transition-colors" />
            </div>

            <button type="submit" disabled={isSubmittingSchedule} className={`w-full py-4 mt-2 text-white font-bold rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 ${editingSchedule ? 'bg-sky-500 hover:bg-sky-400 shadow-[0_4px_0_rgb(14,165,233)]' : 'bg-indigo-500 hover:bg-indigo-400 shadow-[0_4px_0_rgb(99,102,241)]'}`}>
              {isSubmittingSchedule ? '⏳ ĐANG LƯU...' : (editingSchedule ? '💾 LƯU THAY ĐỔI' : '➕ THÊM VÀO LỊCH')}
            </button>
          </form>
        </div>
      </div>

      {/* CỘT PHẢI: HIỂN THỊ CÁC BUỔI HỌC TRONG TUẦN */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm mb-4">
          <span className="text-gray-500 font-bold text-sm">
            Tổng số buổi học / tuần: <span className="text-indigo-500 text-lg">{schedules.length}</span>
          </span>
        </div>
        
        {schedules.length === 0 ? (
          <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-gray-200 border-dashed">
            <span className="text-5xl block mb-4 grayscale opacity-50">📭</span>
            <p className="text-gray-400 font-bold">Lớp này chưa có thời khóa biểu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((sch) => {
              const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
              const formatTimeSafely = (timeStr: any) => {
                if (!timeStr) return '--:--';
                if (typeof timeStr === 'string') return timeStr.substring(0, 5);
                return String(timeStr);
              };
              
              return (
                <div key={sch.schedule_id} className="bg-white rounded-3xl p-5 border-2 border-gray-100 flex items-center justify-between hover:border-indigo-300 shadow-sm transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex flex-col items-center justify-center font-black border border-indigo-100">
                      <span className="text-[10px] opacity-80 uppercase tracking-widest">{days[sch.day_of_week - 1]?.split(' ')[0]}</span>
                      <span className="text-xl">{days[sch.day_of_week - 1]?.split(' ')[1] || 'CN'}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">
                        {formatTimeSafely(sch.start_time)} - {formatTimeSafely(sch.end_time)}
                      </h3>
                      <p className="text-xs font-bold text-gray-500 mt-1">📍 Phòng: {sch.room || 'Chưa xếp phòng'}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => setEditingSchedule(sch)} className="w-10 h-10 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center hover:bg-sky-100 hover:text-sky-600 transition-colors font-bold" title="Sửa">✏️</button>
                    <button onClick={async () => {
                      if (confirm('Xóa lịch học này?')) {
                        await deleteClassScheduleAction(sch.schedule_id);
                        loadSchedule();
                      }
                    }} className="w-10 h-10 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 transition-colors font-bold" title="Xóa buổi học">✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}