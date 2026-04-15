'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAssignmentForStudentAction } from '@/modules/assignments/controller/assignment.action';
import { submitAssignmentAction } from '@/modules/assignments/controller/submission.action';

export default function TakeAssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const resolvedParams = use(params);
  const assignmentId = parseInt(resolvedParams.assignmentId);
  const router = useRouter();

  const [assignment, setAssignment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resultData, setResultData] = useState<{correctCount: number, totalQuestions: number, needsManualGrading: boolean} | null>(null);
  
  useEffect(() => {
    async function loadData() {
      const res = await getAssignmentForStudentAction(assignmentId);
      if (res.success) {
        setAssignment(res.data?.assignment);
        setQuestions(res.data?.questions || []);
        if (res.data?.assignment?.time_limit_min) {
          setTimeLeft(res.data.assignment.time_limit_min * 60);
        }
      } else {
        alert(res.message);
        router.back();
      }
      setIsLoading(false);
    }
    loadData();
  }, [assignmentId, router]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft(t => (t !== null ? t - 1 : null)), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleAnswerSelect = (questionId: number, answerValue: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerValue }));
  };

  const handleFinalSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    
    const timeSpentSec = assignment?.time_limit_min 
      ? (assignment.time_limit_min * 60) - (timeLeft || 0) 
      : 0;

    const res = await submitAssignmentAction(assignmentId, answers, timeSpentSec);
    
    if (res.success && res.data) { 
        setResultData({
          correctCount: res.data.correctCount,
          totalQuestions: res.data.totalQuestions,
          needsManualGrading: res.data.needsManualGrading
        });
      } else {
      alert(res.message || 'Lỗi khi nộp bài');
    }
    setIsSubmitting(false);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-2xl text-sky-500 animate-pulse">⏳ Đang tải đề thi...</div>;

  if (resultData) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
        <div className="bg-slate-800 p-10 rounded-[3rem] border border-slate-700 text-center max-w-lg w-full shadow-2xl border-b-8 border-b-sky-500">
          <div className="text-8xl mb-6 drop-shadow-lg">🎉</div>
          <h2 className="text-3xl font-black text-white mb-6">Nộp bài thành công!</h2>
          
          {/* NẾU CÓ TỰ LUẬN -> Chỉ báo chờ chấm */}
          {resultData.needsManualGrading ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 mb-8 text-amber-400 font-medium">
              <span className="text-2xl block mb-2">✍️</span>
              Bài thi của bạn có câu hỏi tự luận. Vui lòng chờ Thầy/Cô chấm bài để biết kết quả cuối cùng nhé!
            </div>
          ) : (
            // NẾU CHỈ CÓ TRẮC NGHIỆM -> Hiện số câu đúng / Tổng câu
            <div className="bg-slate-900/50 border border-slate-700 rounded-3xl p-8 mb-8 shadow-inner">
              <p className="text-slate-500 font-black uppercase tracking-widest mb-4 text-xs">SỐ CÂU TRẢ LỜI ĐÚNG</p>
              <div className="flex items-baseline justify-center font-black gap-1">
                <span className="text-7xl text-sky-400 tracking-tight drop-shadow-md">
                  {resultData.correctCount}
                </span>
                <span className="text-4xl text-sky-500/50">
                  /{resultData.totalQuestions}
                </span>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => router.push(`/classes/${assignment?.class_id}`)} 
            className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white text-lg font-black rounded-2xl transition-all shadow-[0_6px_0_rgb(5,150,105)] active:translate-y-[4px] active:shadow-none"
          >
            TRỞ VỀ LỚP HỌC
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto pb-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start px-4 lg:px-8">
      
      {/* ⬅️ CỘT TIẾN ĐỘ (BÊN TRÁI) - Chiếm 3/12 không gian */}
      <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-8">
        
        {/* Khối đồng hồ */}
        {timeLeft !== null && (
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl">
            <div className={`text-center p-4 rounded-2xl border-2 transition-colors ${timeLeft < 300 ? 'bg-rose-500/10 border-rose-500/50 text-rose-500 animate-pulse' : 'bg-sky-500/10 border-sky-500/30 text-sky-400'}`}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Thời gian còn lại</p>
              <p className="text-4xl font-black font-mono">{formatTime(timeLeft)}</p>
            </div>
          </div>
        )}

        {/* Khối bản đồ */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 pb-4 border-b border-slate-700/50 text-center">Tiến độ làm bài</p>
          <div className="grid grid-cols-4 xl:grid-cols-5 gap-2 mb-8">
            {questions.map((q, idx) => (
              <button 
                key={q.question_id}
                onClick={() => document.getElementById(`question-${q.question_id}`)?.scrollIntoView({ behavior: 'smooth' })}
                className={`aspect-square rounded-xl font-black text-sm flex items-center justify-center border-2 transition-all ${
                  answers[q.question_id] !== undefined && answers[q.question_id] !== ''
                    ? 'bg-sky-500 border-sky-400 text-white shadow-[0_0_8px_rgba(14,165,233,0.4)]' 
                    : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowConfirmModal(true)} 
            disabled={isSubmitting} 
            className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-400 shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-[4px] active:shadow-none disabled:opacity-50"
          >
            {isSubmitting ? 'ĐANG XỬ LÝ...' : '🚀 NỘP BÀI THI'}
          </button>
        </div>
      </div>

      {/* ➡️ CỘT CÂU HỎI (BÊN PHẢI) - Chiếm 9/12 không gian */}
      <div className="lg:col-span-9 space-y-6">
        
        {/* Header đề thi */}
        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl">
          <h1 className="text-2xl font-black text-white mb-2">{assignment?.title}</h1>
          <p className="text-slate-400 text-sm leading-relaxed">{assignment?.description}</p>
        </div>

        {/* List câu hỏi */}
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={q.question_id} id={`question-${q.question_id}`} className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl scroll-mt-24">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700/50">
                <h3 className="text-lg font-bold text-sky-400">Câu {index + 1} <span className="text-xs text-slate-500 font-normal ml-2">({q.points} điểm)</span></h3>
                <span className="text-[10px] font-bold bg-slate-900 text-slate-500 px-2 py-1 rounded border border-slate-700 uppercase">{q.question_type.replace('_', ' ')}</span>
              </div>
              <div className="text-slate-200 font-medium text-lg mb-8 leading-relaxed">{q.content?.text}</div>
              
              {q.content?.media && q.content.media.length > 0 && (
                 <img src={q.content.media[0].url} alt="Minh họa" className="max-h-80 rounded-2xl border border-slate-600 mb-8 shadow-lg" />
              )}
              
              {q.question_type === 'multiple_choice' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.content?.options?.map((opt: any, optIdx: number) => {
                    const isSelected = answers[q.question_id] === optIdx;
                    return (
                      <button key={optIdx} onClick={() => handleAnswerSelect(q.question_id, optIdx)} className={`flex items-center text-left gap-4 p-4 rounded-2xl border-2 transition-all outline-none ${isSelected ? 'bg-sky-500/20 border-sky-500' : 'bg-slate-900/30 border-slate-700 hover:border-sky-500/50'}`}>
                        <div className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-sky-500 bg-sky-500' : 'border-slate-500'}`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <span className={`font-bold ${isSelected ? 'text-sky-300' : 'text-slate-400'}`}>{opt.label}. {opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {q.question_type === 'true_false' && (
                <div className="flex gap-4">
                  <button onClick={() => handleAnswerSelect(q.question_id, true)} className={`flex-1 py-4 font-bold rounded-2xl border-2 transition-all ${answers[q.question_id] === true ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900/30 border-slate-700 text-slate-500 hover:border-emerald-500/50'}`}>ĐÚNG</button>
                  <button onClick={() => handleAnswerSelect(q.question_id, false)} className={`flex-1 py-4 font-bold rounded-2xl border-2 transition-all ${answers[q.question_id] === false ? 'bg-rose-50 border-rose-500 text-rose-400' : 'bg-slate-900/30 border-slate-700 text-slate-500 hover:border-rose-500/50'}`}>SAI</button>
                </div>
              )}

              {q.question_type === 'essay' && (
                <textarea rows={6} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 focus:border-sky-500 outline-none text-slate-200" value={answers[q.question_id] || ''} onChange={(e) => handleAnswerSelect(q.question_id, e.target.value)} placeholder="Nhập bài làm của bạn..."></textarea>
              )}
            </div>
          ))}
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay làm mờ nền */}
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
          
          {/* Nội dung Modal */}
          <div className="relative bg-slate-800 rounded-[2rem] border border-slate-700 p-8 max-w-sm w-full shadow-2xl text-center transform animate-fade-in-up">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-2xl font-black text-white mb-2">Chốt nộp bài?</h3>
            <p className="text-slate-400 text-sm mb-8">Hệ thống sẽ ghi nhận kết quả ngay lập tức và bạn không thể sửa lại đáp án.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
              >
                Làm tiếp
              </button>
              <button 
                onClick={handleFinalSubmit}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}