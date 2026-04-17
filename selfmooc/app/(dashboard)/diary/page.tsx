'use client';

import { useEffect, useState } from 'react';
import { getMySubmissionsAction } from '@/modules/assignments/controller/submission.action';

export default function StudentDiaryPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const res = await getMySubmissionsAction();
      if (res.success) setSubmissions(res.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr));
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 px-4">
      
      {/* HEADER TƯƠI SÁNG */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center text-3xl border-2 border-sky-200 shadow-sm">📖</div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">Nhật Ký Học Tập</h1>
          <p className="text-gray-500 font-bold mt-1">Nơi lưu giữ mọi nỗ lực và điểm số của bạn</p>
        </div>
      </div>

      {/* BẢNG KẾT QUẢ */}
      <div className="bg-white rounded-[2rem] border-2 border-sky-100 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-10 text-center text-sky-500 font-bold animate-pulse">⏳ Đang tải dữ liệu...</div>
        ) : submissions.length === 0 ? (
          <div className="p-20 text-center text-gray-400 font-bold">
            <span className="text-6xl block mb-4">📭</span>
            Bạn chưa có lịch sử làm bài nào.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-sky-50/50 text-sky-700 text-sm border-b-2 border-sky-100">
                <th className="p-6 font-black w-20 text-center uppercase tracking-wider text-xs">STT</th>
                <th className="p-6 font-black uppercase tracking-wider text-xs">Tên bài tập</th>
                <th className="p-6 font-black uppercase tracking-wider text-xs">Thời gian nộp</th>
                <th className="p-6 font-black text-center uppercase tracking-wider text-xs">Trạng thái</th>
                <th className="p-6 font-black text-center uppercase tracking-wider text-xs">Kết quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((sub, idx) => (
                <tr key={sub.submission_id} className="hover:bg-sky-50 transition-colors group">
                  <td className="p-6 text-center font-bold text-gray-400 group-hover:text-sky-500 transition-colors">{idx + 1}</td>
                  <td className="p-6">
                    <p className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600 transition-colors">{sub.title}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-md shadow-sm">{sub.assignment_type}</span>
                  </td>
                  <td className="p-6 text-sm font-bold text-gray-500">{formatDate(sub.submitted_at)}</td>
                  <td className="p-6 text-center">
                    {sub.status === 'graded' 
                      ? <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold shadow-sm"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Đã chấm</span>
                      : <span className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold shadow-sm"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Chờ chấm</span>
                    }
                  </td>
                  <td className="p-6 text-center font-black text-2xl text-sky-500">
                    {sub.status === 'graded' ? `${Number(sub.grade).toFixed(2)}/10` : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}