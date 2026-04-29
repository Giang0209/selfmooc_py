'use client';

import { useEffect, useState, Suspense } from 'react';
import { getMyWeeklyScheduleAction } from '@/modules/classes/controller/schedule.action';
import { getScheduleDisplayInfoAction } from '@/modules/classes/controller/dashboard.action';
import { useSearchParams, useRouter } from 'next/navigation';

function ScheduleContent() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayInfo, setDisplayInfo] = useState<any>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = searchParams.get('studentId') ? parseInt(searchParams.get('studentId')!) : undefined;

  useEffect(() => {
    async function fetchData() {
      try {
        const [scheduleRes, infoRes] = await Promise.all([
          getMyWeeklyScheduleAction(studentId),
          getScheduleDisplayInfoAction(studentId)
        ]);
        if (scheduleRes.success) setSchedule(scheduleRes.data);
        if (infoRes.success) setDisplayInfo(infoRes.data);
      } catch (err) {
        console.error("Lỗi:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [studentId]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#AEE2FF', fontFamily: 'sans-serif', fontWeight: 'bold' }}>
      Đang chuẩn bị bảng vẽ... ✏️
    </div>;
  }

  const days = [1, 2, 3, 4, 5];
  const displayNames = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu'];
  const colors = ['#00AEEF', '#8DC63F', '#FFF200', '#F7941D', '#ED1C24'];

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#AEE2FF', padding: '10px', fontFamily: 'inherit', borderRadius: '40px' }}>
      <div style={{ width: '100%', backgroundColor: 'white', borderRadius: '40px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '10px solid rgba(255,255,255,0.5)', position: 'relative' }}>



        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="text-[40px] md:text-[60px] font-black text-[#00AEEF] m-0 uppercase tracking-[-2px]">
            Thời khóa biểu
          </h1>
          {(displayInfo?.role === 'student' || displayInfo?.viewingAsChild) && (
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#666', marginTop: '10px' }}>
              Học sinh: <span style={{ color: '#00AEEF' }}>{displayInfo.studentName}</span>
              {' | '}
              Lớp: <span style={{ textDecoration: 'underline dotted', color: '#00AEEF' }}>{displayInfo.className}</span>
            </div>
          )}
        </div>

        {/* CONTAINER CHÍNH */}
        <div style={{ display: 'flex', gap: '15px' }}>

          {/* CỘT SÁNG CHIỀU */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingTop: '70px', width: '70px' }}>
            <div style={{ flex: 1, backgroundColor: '#00AEEF', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: '900', fontSize: '24px', writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>SÁNG</span>
            </div>
            <div style={{ flex: 1, backgroundColor: '#FF8DA1', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: '900', fontSize: '24px', writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>CHIỀU</span>
            </div>
          </div>

          {/* GRID THỜI GIAN */}
          <div style={{ flex: 1 }}>
            {/* HEADERS THỨ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '15px' }}>
              {days.map((d, i) => (
                <div key={d} style={{ backgroundColor: colors[i], color: i === 2 ? '#333' : 'white', height: '55px', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '18px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  {displayNames[i]}
                </div>
              ))}
            </div>

            {/* Ô DỮ LIỆU */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', minHeight: '500px' }}>
              {days.map((d) => {
                const dayData = schedule.filter(s => s.day_of_week === d);
                const morning = dayData.filter(s => parseInt(s.start_time?.split(':')[0] || '0') < 12);
                const afternoon = dayData.filter(s => parseInt(s.start_time?.split(':')[0] || '0') >= 12);

                return (
                  <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {/* KHỐI SÁNG */}
                    <div style={{ flex: 1, backgroundColor: '#E0F7FF', borderRadius: '25px', padding: '10px', border: '2px solid #B3E5FC', overflowY: 'auto' }}>
                      {morning.map((item, idx) => (
                        <div key={idx} style={{ backgroundColor: 'white', padding: '8px', borderRadius: '15px', marginBottom: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#00AEEF' }}>{item.start_time?.slice(0, 5)}</div>
                          <div style={{ fontSize: '12px', fontWeight: '900', color: '#333', textTransform: 'uppercase' }}>{item.class_name}</div>
                        </div>
                      ))}
                    </div>
                    {/* KHỐI CHIỀU */}
                    <div style={{ flex: 1, backgroundColor: '#FFF0F3', borderRadius: '25px', padding: '10px', border: '2px solid #F8BBD0', overflowY: 'auto' }}>
                      {afternoon.map((item, idx) => (
                        <div key={idx} style={{ backgroundColor: 'white', padding: '8px', borderRadius: '15px', marginBottom: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#FF8DA1' }}>{item.start_time?.slice(0, 5)}</div>
                          <div style={{ fontSize: '12px', fontWeight: '900', color: '#333', textTransform: 'uppercase' }}>{item.class_name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', opacity: 0.5 }}>
          <div style={{ fontSize: '30px' }}>📚 ✏️ ☁️</div>
          <div style={{ fontWeight: 'bold', color: '#00AEEF' }}>#SelfMOOC</div>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <ScheduleContent />
    </Suspense>
  );
}
