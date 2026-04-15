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
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 bg-sky-500/20 rounded-2xl flex items-center justify-center text-3xl border-2 border-sky-500/50">📖</div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Nhật Ký Học Tập</h1>
          <p className="text-slate-500 font-medium">Nơi lưu giữ mọi nỗ lực và điểm số của bạn</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-10 text-center text-sky-500 font-bold animate-pulse">⏳ Đang tải dữ liệu...</div>
        ) : submissions.length === 0 ? (
          <div className="p-20 text-center text-slate-500 font-bold">Bạn chưa có lịch sử làm bài nào.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-sm border-b border-slate-200 dark:border-slate-700">
                <th className="p-6 font-bold w-20 text-center">STT</th>
                <th className="p-6 font-bold">Tên bài tập</th>
                <th className="p-6 font-bold">Thời gian nộp</th>
                <th className="p-6 font-bold text-center">Trạng thái</th>
                <th className="p-6 font-bold text-center">Kết quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {submissions.map((sub, idx) => (
                <tr key={sub.submission_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="p-6 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="p-6">
                    <p className="font-bold text-slate-800 dark:text-white text-lg mb-1">{sub.title}</p>
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-500 bg-sky-500/10 px-2 py-1 rounded-lg">{sub.assignment_type}</span>
                  </td>
                  <td className="p-6 text-sm font-mono text-slate-500">{formatDate(sub.submitted_at)}</td>
                  <td className="p-6 text-center">
                    {sub.status === 'graded' 
                      ? <span className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-bold"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Đã chấm</span>
                      : <span className="inline-flex items-center gap-1 text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full text-xs font-bold"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Chờ chấm</span>
                    }
                  </td>
                  <td className="p-6 text-center font-black text-xl text-sky-500">
                    {sub.status === 'graded' ? `${Number(sub.grade).toFixed(2)}/10` : '—'}
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