'use client';

import { useEffect, useState } from 'react';
import { getDashboardStatsAction } from '@/modules/classes/controller/dashboard.action';

export default function ParentDashboard() {
  const [childrenStats, setChildrenStats] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const res = await getDashboardStatsAction();
      if (res.success && Array.isArray(res.data)) {
        setChildrenStats(res.data);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8">
        {childrenStats.length > 0 ? (
          childrenStats.map((child, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[3rem] shadow-xl border-b-8 border-indigo-100 overflow-hidden relative">
              {/* Trang trí nền */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-20 -mt-20 z-0 opacity-50"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
                        {child.student_name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-gray-800">Học sinh: {child.student_name}</h3>
                        <p className="text-indigo-600 font-bold tracking-wide">Lớp: {child.class_name || 'Đã phân lớp'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-50 p-6 rounded-3xl border-2 border-green-100">
                        <p className="text-green-600 font-bold uppercase text-xs mb-1">Điểm trung bình</p>
                        <h4 className="text-4xl font-black text-green-700">{Number(child.avg_grade).toFixed(1)}</h4>
                        <p className="text-green-500 text-sm mt-2 font-medium">✨ Đang tiến bộ rất tốt</p>
                    </div>

                    <div className="bg-rose-50 p-6 rounded-3xl border-2 border-rose-100">
                        <p className="text-rose-600 font-bold uppercase text-xs mb-1">Số buổi nghỉ</p>
                        <h4 className="text-4xl font-black text-rose-700">{child.absences || 0}</h4>
                        <p className={`text-sm mt-2 font-medium ${child.absences > 3 ? 'text-rose-600' : 'text-rose-400'}`}>
                            {child.absences > 3 ? '⚠️ Cần lưu ý chuyên cần' : '✅ Chuyên cần ổn định'}
                        </p>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100">
                        <p className="text-blue-600 font-bold uppercase text-xs mb-1">Tin nhắn mới</p>
                        <h4 className="text-4xl font-black text-blue-700">0</h4>
                        <button className="text-blue-500 text-sm mt-2 font-bold hover:underline">📩 Nhắn tin cho GV</button>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-100 flex flex-wrap gap-4">
                    <button className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:shadow-lg transition-all">
                        Xem chi tiết học tập
                    </button>
                    <a href={`/schedule?studentId=${child.student_id}`} className="px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all">
                        Xem lịch học của con
                    </a>
                </div>
              </div>
            </div>
          ))
        ) : (
            <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border-4 border-dashed border-gray-100">
                <span className="text-6xl mb-6 block">👨‍👩‍👧‍👦</span>
                <p className="text-2xl font-black text-gray-400">Bạn chưa liên kết tài khoản với con em mình.</p>
                <button className="mt-6 px-8 py-4 bg-indigo-500 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all shadow-lg">
                    Liên Kết Ngay
                </button>
            </div>
        )}
      </div>

      {/* THÔNG BÁO TỪ NHÀ TRƯỜNG */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border-b-8 border-sky-100">
          <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
              <span>🔔 Thông báo từ giáo viên</span>
          </h3>
          <div className="space-y-4">
              <div className="p-5 bg-gray-50 rounded-3xl flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl">📝</div>
                  <div>
                      <p className="font-bold text-gray-800">Nhắc nhở đóng học phí kỳ 2</p>
                      <p className="text-sm text-gray-500">Hạn cuối là ngày 30/04/2026. Vui lòng kiểm tra email...</p>
                      <p className="text-xs text-amber-600 font-bold mt-2">Hệ thống • 1 ngày trước</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
