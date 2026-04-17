'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSubmissionDetailAction, saveGradeAction } from '@/modules/assignments/controller/grading.action';

export default function GradingDetailPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const resolvedParams = use(params);
  const submissionId = parseInt(resolvedParams.submissionId);
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [manualGrades, setManualGrades] = useState<Record<number, { points: number, comment: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const res = await getSubmissionDetailAction(submissionId);
      if (res.success) setData(res.data);
    }
    loadData();
  }, [submissionId]);

  const handleGradeChange = (qId: number, field: 'points' | 'comment', value: any) => {
    setManualGrades(prev => ({
      ...prev,
      [qId]: { ...prev[qId], [field]: value }
    }));
  };

  const handleSaveGrade = async () => {
    setIsSubmitting(true);
    const res = await saveGradeAction(submissionId, manualGrades);
    if (res.success) {
      alert(res.message);
      router.push('/grading'); // Quay lại danh sách chờ chấm
    } else {
      alert(res.message);
    }
    setIsSubmitting(false);
  };

  if (!data) return <div className="p-20 text-center text-amber-500 font-bold animate-pulse">⏳ Đang tải bài làm...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-10 px-4">
      <button 
        onClick={() => router.push('/grading')}
        className="mb-6 font-bold text-gray-500 hover:text-sky-500 flex items-center gap-2 transition-colors"
      >
        <span>⬅</span> Quay lại danh sách lớp
      </button>
      {/* Header */}
      <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl mb-8 flex justify-between items-center">
        <div>
          <p className="text-amber-500 font-bold text-xs tracking-widest uppercase mb-1">CHẤM BÀI TỰ LUẬN</p>
          <h1 className="text-2xl font-black text-white">{data.submission.assignment_title}</h1>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-sm font-bold">Học sinh</p>
          <p className="text-xl font-bold text-sky-400">{data.submission.student_name}</p>
          <p className="text-xs font-mono text-slate-500">{data.submission.student_code}</p>
        </div>
      </div>

      {/* Danh sách câu trả lời */}
      <div className="space-y-6 mb-8">
        {data.answers.map((ans: any, idx: number) => (
          <div key={idx} className={`bg-slate-800 rounded-3xl p-6 border shadow-md ${ans.question_type === 'essay' ? 'border-amber-500/50' : 'border-slate-700 opacity-60'}`}>
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-sky-400">Câu {idx + 1} <span className="text-slate-500 text-xs">({ans.question_type})</span></span>
              {ans.question_type !== 'essay' && (
                <span className={`px-2 py-1 rounded text-xs font-bold ${ans.is_correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  Auto-graded: {ans.points_earned}/{ans.points_max} đ
                </span>
              )}
            </div>
            
            <div className="bg-slate-900/50 p-4 rounded-2xl text-slate-300 font-medium whitespace-pre-wrap mb-4">
              {/* Bài làm của học sinh */}
              {ans.text_answer || ans.bool_answer?.toString() || `Đáp án số: ${ans.selected_index}` || 'Không có câu trả lời'}
            </div>

            {/* Form chấm điểm cho câu Tự Luận */}
            {ans.question_type === 'essay' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-amber-500 font-bold text-sm">Điểm số (Max: {ans.points_max}đ):</label>
                  <input 
                    type="number" max={ans.points_max} min="0" step="0.5"
                    className="w-24 bg-slate-900 border border-amber-500/50 rounded-xl px-3 py-2 text-white font-bold text-center outline-none"
                    placeholder="0"
                    onChange={(e) => handleGradeChange(ans.pg_question_id, 'points', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-amber-500 font-bold text-sm block mb-2">Nhận xét của Giáo viên:</label>
                  <textarea 
                    rows={2} placeholder="Bài làm rất tốt..."
                    className="w-full bg-slate-900 border border-amber-500/50 rounded-xl p-3 text-slate-300 outline-none resize-none"
                    onChange={(e) => handleGradeChange(ans.pg_question_id, 'comment', e.target.value)}
                  ></textarea>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={handleSaveGrade} disabled={isSubmitting} className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-400 shadow-[0_4px_0_rgb(5,150,105)] transition-all disabled:opacity-50">
        {isSubmitting ? '⏳ ĐANG LƯU...' : '✅ LƯU ĐIỂM & GỬI THÔNG BÁO'}
      </button>
    </div>
  );
}