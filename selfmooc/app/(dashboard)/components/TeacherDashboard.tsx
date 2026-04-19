'use client';

import { useEffect, useState } from 'react';
import { getDashboardStatsAction } from '@/modules/classes/controller/dashboard.action';
import { getMyWeeklyScheduleAction } from '@/modules/classes/controller/schedule.action';

export default function TeacherDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const statsRes = await getDashboardStatsAction();
      if (statsRes.success) setStats(statsRes.data);

      const scheduleRes = await getMyWeeklyScheduleAction();
      if (scheduleRes.success) setSchedule(scheduleRes.data);
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Lớp đang dạy" 
          value={stats?.total_classes || 0} 
          icon="🏫" 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Tổng học sinh" 
          value={stats?.total_students || 0} 
          icon="👥" 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Bài cần chấm" 
          value={stats?.pending_grades || 0} 
          icon="⏳" 
          color="bg-orange-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SCHEDULE SUMMARY */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-sky-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>📅</span> Lịch dạy hôm nay
            </h3>
            <a href="/schedule" className="text-sm font-bold text-blue-600 hover:underline">Xem toàn tuần</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {(() => {
                const today = new Date().getDay();
                const todaySchedule = schedule.filter(s => s.day_of_week === today);
                
                return todaySchedule.length > 0 ? (
                    todaySchedule.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '25px', border: '1px solid #eee' }}>
                            <div style={{ width: '60px', textAlign: 'center', fontWeight: '900', color: '#00AEEF' }}>
                                {item.start_time.slice(0, 5)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: '900', color: '#333', textTransform: 'uppercase' }}>{item.class_name}</p>
                                <p style={{ margin: 0, fontSize: '12px', color: '#999', fontWeight: 'bold' }}>📍 Phòng: {item.room}</p>
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: '900', backgroundColor: '#E0F7FF', color: '#00AEEF', padding: '4px 8px', borderRadius: '10px' }}>LIVE</div>
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#BBB', textAlign: 'center', padding: '40px 0', fontWeight: 'bold' }}>Hôm nay bạn không có lịch dạy nào.</p>
                );
            })()}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-purple-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>⚡ Thao tác nhanh</span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-blue-50 text-blue-600 font-bold rounded-2xl hover:bg-blue-100 transition-all flex flex-col items-center gap-2">
                <span className="text-3xl">📝</span>
                Tạo Bài Tập
            </button>
            <button className="p-4 bg-purple-50 text-purple-600 font-bold rounded-2xl hover:bg-purple-100 transition-all flex flex-col items-center gap-2">
                <span className="text-3xl">🗂️</span>
                Thêm Câu Hỏi
            </button>
            <button className="p-4 bg-green-50 text-green-600 font-bold rounded-2xl hover:bg-green-100 transition-all flex flex-col items-center gap-2">
                <span className="text-3xl">📢</span>
                Thông Báo
            </button>
            <button className="p-4 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-all flex flex-col items-center gap-2">
                <span className="text-3xl">📊</span>
                Xuất Báo Cáo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className={`${color} p-6 rounded-[2rem] text-white shadow-lg transform hover:-translate-y-1 transition-all`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white/80 font-bold uppercase text-xs tracking-wider mb-1">{title}</p>
          <h4 className="text-4xl font-black">{value}</h4>
        </div>
        <span className="text-4xl bg-white/20 p-2 rounded-2xl">{icon}</span>
      </div>
    </div>
  );
}
