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
      router.push('/grading'); 
    } else {
      alert(res.message);
    }
    setIsSubmitting(false);
  };

  if (!data) return <div className="p-20 text-center text-amber-500 font-bold animate-pulse">⏳ Đang tải bài làm...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-10 px-4 pt-8">
      <button 
        onClick={() => router.push('/grading')}
        className="mb-6 font-bold text-gray-500 hover:text-sky-500 flex items-center gap-2 transition-colors"
      >
        <span>⬅</span> Quay lại danh sách lớp
      </button>
      
      {/* Header Info */}
      <div className="bg-white rounded-[2rem] p-8 border-2 border-sky-100 shadow-sm mb-8 flex justify-between items-center">
        <div>
          <p className="text-amber-600 font-black text-xs tracking-widest uppercase mb-1">CHẤM BÀI TỰ LUẬN</p>
          <h1 className="text-2xl font-black text-gray-800">{data.submission.assignment_title}</h1>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-sm font-bold">Học sinh</p>
          <p className="text-xl font-black text-sky-600">{data.submission.student_name}</p>
          <p className="text-xs font-mono font-bold text-gray-400">{data.submission.student_code}</p>
        </div>
      </div>

      {/* Danh sách câu trả lời */}
      <div className="space-y-6 mb-8">
        {data.answers.map((ans: any, idx: number) => (
          <div key={idx} className={`bg-white rounded-3xl p-6 border-2 shadow-sm ${ans.question_type === 'essay' ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100 opacity-70'}`}>
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-sky-600 text-lg">Câu {idx + 1} <span className="text-gray-400 text-sm font-medium">({ans.question_type})</span></span>
              {ans.question_type !== 'essay' && (
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${ans.is_correct ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                  Auto-graded: {ans.points_earned}/{ans.points_max} đ
                </span>
              )}
            </div>
            
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-700 font-medium whitespace-pre-wrap mb-4">
              {/* Bài làm của học sinh */}
              {ans.text_answer || ans.bool_answer?.toString() || `Đáp án số: ${ans.selected_index}` || 'Không có câu trả lời'}
            </div>

            {/* Form chấm điểm cho câu Tự Luận */}
            {ans.question_type === 'essay' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-amber-700 font-bold text-sm">Điểm số (Tối đa: {ans.points_max}đ):</label>
                  <input 
                    type="number" max={ans.points_max} min="0" step="0.5"
                    className="w-24 bg-white border-2 border-amber-300 focus:border-amber-500 rounded-xl px-3 py-2 text-gray-800 font-bold text-center outline-none transition-colors"
                    placeholder="0"
                    onChange={(e) => handleGradeChange(ans.pg_question_id, 'points', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-amber-700 font-bold text-sm block mb-2">Nhận xét của Giáo viên:</label>
                  <textarea 
                    rows={3} placeholder="Bài làm rất tốt..."
                    className="w-full bg-white border-2 border-amber-200 focus:border-amber-500 rounded-xl p-4 text-gray-800 font-medium outline-none resize-none transition-colors placeholder:text-gray-400"
                    onChange={(e) => handleGradeChange(ans.pg_question_id, 'comment', e.target.value)}
                  ></textarea>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={handleSaveGrade} disabled={isSubmitting} className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-400 shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none">
        {isSubmitting ? '⏳ ĐANG LƯU...' : '✅ LƯU ĐIỂM & GỬI THÔNG BÁO'}
      </button>
    </div>
  );
}