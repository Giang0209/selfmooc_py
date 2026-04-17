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
      
      {/* HEADER TƯƠI SÁNG */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl border-2 border-amber-200 shadow-sm">✍️</div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">Trung Tâm Chấm Bài</h1>
          <p className="text-gray-500 font-bold mt-1">Danh sách các bài thi tự luận đang chờ Thầy/Cô đánh giá</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-amber-500 font-bold animate-pulse text-xl">⏳ Đang tải danh sách chờ chấm...</div>
      ) : pendingSubmissions.length === 0 ? (
        <div className="bg-gray-50 rounded-3xl p-20 text-center border-2 border-dashed border-gray-200">
          <span className="text-6xl mb-4 block grayscale opacity-50">🎉</span>
          <h3 className="text-2xl font-bold text-gray-400 mb-2">Tuyệt vời! Không còn bài nào tồn đọng</h3>
          <p className="text-gray-500 font-medium">Thầy/cô đã chấm xong toàn bộ bài tập tự luận của học sinh.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingSubmissions.map((sub) => (
            <div key={sub.submission_id} className="bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-colors">
              
              {/* Chấm tròn báo hiệu chờ chấm */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-[100%] flex items-start justify-end p-3 border-l border-b border-amber-100">
                <span className="w-3 h-3 bg-amber-500 rounded-full animate-ping shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
              </div>
              
              <div className="mb-6">
                <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">CHỜ CHẤM ĐIỂM</p>
                <h3 className="font-bold text-gray-800 text-xl line-clamp-2">{sub.assignment_title}</h3>
              </div>

              {/* Thông tin học sinh */}
              <div className="bg-gray-50 p-4 rounded-2xl mb-6 flex items-center gap-3 border border-gray-200">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black border border-indigo-200">
                  {sub.student_name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-700">{sub.student_name}</p>
                  <p className="text-xs font-mono font-bold text-gray-500">{sub.student_code} • Nộp: {formatRelativeTime(sub.submitted_at)}</p>
                </div>
              </div>

              {/* Nút bấm chuyển hướng */}
              <Link href={`/grading/${sub.submission_id}`}>
                <button className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-xl transition-all shadow-[0_4px_0_rgb(67,56,202)] active:translate-y-[2px] active:shadow-none">
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