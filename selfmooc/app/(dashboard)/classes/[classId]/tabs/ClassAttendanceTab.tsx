'use client';

import { useEffect, useState } from 'react';
import { getClassAttendanceAction, getAttendanceHistoryAction, saveBulkAttendanceAction } from '@/modules/classes/controller/class.action';

export default function ClassAttendanceTab({ classId }: { classId: number }) {
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [todayRes, historyRes] = await Promise.all([
      getClassAttendanceAction(classId),
      getAttendanceHistoryAction(classId)
    ]);
    if (todayRes.success) setAttendanceList(todayRes.data);
    if (historyRes.success) setAttendanceHistory(historyRes.data);
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, [classId]);

  const handleToggleLocalAttendance = (studentId: number, currentStatus: string) => {
    setAttendanceList(prev => prev.map(item => 
      item.student_id === studentId 
        ? { 
            ...item, 
            today_status: currentStatus === 'present' ? 'absent' : 'present',
            total_absences: currentStatus === 'present' ? Number(item.total_absences) + 1 : Number(item.total_absences) - 1 
          } 
        : item
    ));
  };

  const handleSaveSubmit = async () => {
    setIsSaving(true);
    const recordsToSave = attendanceList.map(item => ({
      student_id: item.student_id,
      status: item.today_status
    }));
    const res = await saveBulkAttendanceAction(classId, recordsToSave);
    alert(res.message);
    if (res.success) loadData();
    setIsSaving(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* BẢNG ĐIỂM DANH HÔM NAY */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b-2 border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><span>📅</span> Chốt Điểm Danh Hôm Nay</h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">Ngày: {new Date().toLocaleDateString('vi-VN')} • Tích vào những bạn đi học</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex gap-4 text-sm font-bold">
              <span className="flex items-center gap-2 text-sky-600"><div className="w-4 h-4 rounded bg-sky-100 border border-sky-300 flex items-center justify-center text-xs">✓</div> Có mặt</span>
              <span className="flex items-center gap-2 text-rose-500"><div className="w-4 h-4 rounded bg-rose-50 border border-rose-300"></div> Vắng mặt</span>
            </div>
            <button onClick={handleSaveSubmit} disabled={isSaving || attendanceList.length === 0} className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 transition-colors shadow-[0_4px_0_rgb(5,150,105)] disabled:opacity-50 active:translate-y-[2px] active:shadow-none">
              {isSaving ? '⏳ ĐANG LƯU...' : '💾 LƯU ĐIỂM DANH'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-sky-500 font-bold animate-pulse">Đang chuẩn bị danh sách...</div>
        ) : attendanceList.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold">Lớp chưa có học sinh để điểm danh.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-500 text-sm border-b-2 border-gray-100">
                  <th className="p-4 font-black text-center w-16 uppercase tracking-wider">STT</th>
                  <th className="p-4 font-black uppercase tracking-wider">Họ và tên</th>
                  <th className="p-4 font-black uppercase tracking-wider">MSSV</th>
                  <th className="p-4 font-black text-center uppercase tracking-wider">Trạng thái (Click đổi)</th>
                  <th className="p-4 font-black text-center uppercase tracking-wider">Số lần vắng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendanceList.map((student, idx) => (
                  <tr key={student.student_id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-center text-gray-400 font-bold">{idx + 1}</td>
                    <td className="p-4 font-bold text-gray-800">{student.name}</td>
                    <td className="p-4 font-mono font-bold text-sm text-purple-500 bg-purple-50 px-2 rounded-lg w-fit inline-block mt-3">{student.student_code}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleToggleLocalAttendance(student.student_id, student.today_status)} className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center mx-auto transition-all transform active:scale-90 font-bold ${student.today_status === 'present' ? 'bg-sky-50 border-sky-400 text-sky-600 shadow-sm' : 'bg-gray-100 border-gray-200 text-transparent hover:border-rose-400 hover:bg-rose-50'}`}>
                        {student.today_status === 'present' && '✓'}
                      </button>
                    </td>
                    <td className="p-4 text-center font-bold">
                      <span className={`inline-block min-w-[2rem] px-2 py-1 rounded-md text-xs border ${Number(student.total_absences) > 0 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                        {student.total_absences}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LỊCH SỬ ĐIỂM DANH */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b-2 border-gray-100 bg-gray-50">
           <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><span>📜</span> Lịch Sử Điểm Danh Theo Ngày</h2>
        </div>
        
        {attendanceHistory.length === 0 ? (
          <div className="text-center py-10 text-gray-400 font-bold">Chưa có bản ghi lịch sử nào.</div>
        ) : (
          <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
            {attendanceHistory.map((group) => (
              <div key={group.date} className="border-2 border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                <button onClick={() => setExpandedDate(expandedDate === group.date ? null : group.date)} className="w-full p-5 hover:bg-gray-50 flex justify-between items-center transition-colors outline-none border-b border-transparent">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">📅</span>
                    <span className="text-lg font-bold text-sky-600">{group.date}</span>
                    <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 font-bold rounded-full border border-gray-200">{group.records.length} học sinh</span>
                  </div>
                  <span className={`text-gray-400 font-bold transition-transform duration-300 ${expandedDate === group.date ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {expandedDate === group.date && (
                  <div className="bg-gray-50 border-t-2 border-gray-100 animate-fade-in-down p-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-gray-500 text-xs uppercase tracking-wider border-b-2 border-gray-200">
                          <th className="pb-3 font-black w-16 text-center">STT</th>
                          <th className="pb-3 font-black">Học sinh</th>
                          <th className="pb-3 font-black">MSSV</th>
                          <th className="pb-3 font-black text-center">Tình trạng</th>
                          <th className="pb-3 font-black text-right">Giờ chốt sổ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {group.records.map((hist: any, i: number) => (
                          <tr key={hist.attendance_id} className="hover:bg-white transition-colors">
                            <td className="py-3 text-center text-gray-400 font-bold">{i + 1}</td>
                            <td className="py-3 font-bold text-gray-800">{hist.name}</td>
                            <td className="py-3 text-sm font-mono font-bold text-purple-500">{hist.student_code}</td>
                            <td className="py-3 text-center">
                              {hist.status === 'present' 
                                ? <span className="px-3 py-1 text-xs font-bold bg-sky-50 text-sky-600 rounded-lg border border-sky-200">Có mặt</span>
                                : <span className="px-3 py-1 text-xs font-bold bg-rose-50 text-rose-600 rounded-lg border border-rose-200">Vắng mặt</span>
                              }
                            </td>
                            <td className="py-3 text-right text-xs font-mono font-bold text-gray-500">
                              {new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(hist.recorded_at))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}