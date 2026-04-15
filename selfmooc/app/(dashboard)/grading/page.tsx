'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPendingSubmissionsAction } from '@/modules/assignments/controller/submission.action';

export default function TeacherGradingPage() {
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const res = await getPendingSubmissionsAction();
      if (res.success) setPendingSubmissions(res.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const formatRelativeTime = (dateStr: string) => {
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} giờ trước`;
    return new Intl.DateTimeFormat('vi-VN').format(new Date(dateStr));
  };

  return (
    <div className="max-w-7xl mx-auto pb-10 px-4">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center text-3xl border-2 border-amber-500/50">✍️</div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Trung Tâm Chấm Bài</h1>
          <p className="text-slate-500 font-medium">Danh sách các bài thi tự luận đang chờ Thầy/Cô đánh giá</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-amber-500 font-bold animate-pulse text-xl">⏳ Đang tải danh sách chờ chấm...</div>
      ) : pendingSubmissions.length === 0 ? (
        <div className="bg-slate-800 rounded-3xl p-20 text-center border-2 border-dashed border-slate-700">
          <span className="text-6xl mb-4 block">🎉</span>
          <h3 className="text-2xl font-bold text-white mb-2">Tuyệt vời! Không còn bài nào tồn đọng</h3>
          <p className="text-slate-400">Thầy/cô đã chấm xong toàn bộ bài tập tự luận của học sinh.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingSubmissions.map((sub) => (
            <div key={sub.submission_id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-[100%] flex items-start justify-end p-3">
                <span className="w-3 h-3 bg-amber-500 rounded-full animate-ping"></span>
              </div>
              
              <div className="mb-6">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">CHỜ CHẤM ĐIỂM</p>
                <h3 className="font-bold text-slate-800 dark:text-white text-xl line-clamp-2">{sub.assignment_title}</h3>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl mb-6 flex items-center gap-3 border border-slate-100 dark:border-slate-700/50">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                  {sub.student_name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{sub.student_name}</p>
                  <p className="text-xs font-mono text-slate-500">{sub.student_code} • Nộp: {formatRelativeTime(sub.submitted_at)}</p>
                </div>
              </div>

              {/* Nút bấm chuyển hướng sang giao diện chấm điểm (Ví dụ: /grading/123) */}
              <Link href={`/grading/${sub.submission_id}`}>
                <button className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-[0_4px_0_rgb(67,56,202)] active:translate-y-[2px] active:shadow-none">
                  MỞ BÀI CHẤM NGAY
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}