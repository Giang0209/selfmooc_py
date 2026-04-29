'use client';

import { useEffect, useState } from 'react';
import { getDashboardStatsAction } from '@/modules/classes/controller/dashboard.action';
import { getMyWeeklyScheduleAction } from '@/modules/classes/controller/schedule.action';
import { getMyNotificationsAction } from '@/modules/notifications/notification.action';

export default function StudentDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const statsRes = await getDashboardStatsAction();
      if (statsRes.success) setStats(statsRes.data);

      const scheduleRes = await getMyWeeklyScheduleAction();
      if (scheduleRes.success) setSchedule(scheduleRes.data);

      const notifRes = await getMyNotificationsAction();
      if (notifRes.success) {
        setNotifications(notifRes.data.slice(0, 3)); // chỉ lấy 2-3 cái mới nhất
      }
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Điểm trung bình"
          value={stats?.avg_grade ? Number(stats.avg_grade).toFixed(1) : '0.0'}
          icon="⭐"
          color="bg-gradient-to-br from-yellow-400 to-orange-500"
        />
        <StatCard
          title="Đã xong"
          value={`${stats?.completed_tasks || 0}/${stats?.total_tasks || 0}`}
          icon="✅"
          color="bg-gradient-to-br from-green-400 to-emerald-600"
        />
        <StatCard
          title="Nhiệm vụ mới"
          value={(stats?.total_tasks || 0) - (stats?.completed_tasks || 0)}
          icon="🚀"
          color="bg-gradient-to-br from-blue-400 to-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* TODAY'S SCHEDULE - COMPACT */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-xl shadow-blue-50 border-b-8 border-sky-100">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-3xl font-black text-gray-800 flex items-center gap-3">
              <span className="bg-blue-100 p-3 rounded-2xl text-3xl">📅</span> Lịch học hôm nay
            </h3>
            <a href="/schedule" className="px-6 py-2 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:shadow-lg transition-all">
              Xem toàn bộ tuần
            </a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {(() => {
              const today = new Date().getDay();
              const todaySchedule = schedule.filter(s => s.day_of_week === today);

              return todaySchedule.length > 0 ? (
                todaySchedule.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '30px', border: '2px solid transparent', transition: 'all 0.3s' }}>
                    <div style={{ width: '80px', height: '80px', backgroundColor: '#00AEEF', color: 'white', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0, 174, 239, 0.3)' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', opacity: 0.8 }}>Bắt đầu</span>
                      <span style={{ fontSize: '20px', fontWeight: '900' }}>{item.start_time.slice(0, 5)}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#333', textTransform: 'uppercase' }}>{item.class_name}</h4>
                      <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#999' }}>📍 Phòng: {item.room}</span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', borderLeft: '2px solid #ddd', paddingLeft: '15px', color: '#00AEEF' }}>🕒 Kết thúc: {item.end_time.slice(0, 5)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'none' }} className="md:block">
                      <button style={{ padding: '12px 24px', backgroundColor: 'white', color: '#00AEEF', fontWeight: 'bold', borderRadius: '15px', border: '2px solid #00AEEF', cursor: 'pointer' }}>
                        Vào lớp
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f9f9f9', borderRadius: '40px', border: '4px dashed #eee' }}>
                  <span style={{ fontSize: '60px', display: 'block', marginBottom: '15px' }}>😎</span>
                  <p style={{ fontSize: '20px', fontWeight: '900', color: '#BBB', margin: 0 }}>Hôm nay bạn được nghỉ! Tận hưởng thôi!</p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="space-y-6">


          <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border-2 border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 items-center gap-2 flex">
              <span>📢</span> Thông báo mới
            </h3>

            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((n, i) => (
                  <div
                    key={n._id}
                    className={`p-4 rounded-2xl border-l-4 ${n.is_read
                      ? 'bg-gray-50 border-gray-300'
                      : 'bg-blue-50 border-blue-400'
                      }`}
                  >
                    <p className={`text-sm font-bold ${n.is_read ? 'text-gray-700' : 'text-blue-900'
                      }`}>
                      {n.title}
                    </p>

                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {n.body}
                    </p>

                    <p className="text-[10px] text-gray-400 mt-1">
                      {n.created_at
                        ? new Date(n.created_at).toLocaleString()
                        : ''}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400 font-bold">
                  📭 Không có thông báo mới
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className={`${color} p-8 rounded-[2.5rem] text-white shadow-xl transform hover:-translate-y-2 transition-all`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-white/80 font-bold uppercase text-xs tracking-widest mb-2">{title}</p>
          <h4 className="text-5xl font-black">{value}</h4>
        </div>
        <span className="text-5xl bg-black/10 p-4 rounded-3xl backdrop-blur-sm">{icon}</span>
      </div>
    </div>
  );
}
