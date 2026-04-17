'use client';

import { use, useEffect, useState, useRef } from 'react';
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
  
  const [resultData, setResultData] = useState<{correctCount: number, totalQuestions: number, needsManualGrading: boolean, isCheated?: boolean} | null>(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

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

  // ========================================================
  // 🚀 HỆ THỐNG ANTI-CHEAT (CHỐNG CHUYỂN TAB)
  // ========================================================
  useEffect(() => {
    if (!assignment || assignment.assignment_type === 'homework' || resultData || isSubmitting) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          // 🎯 Đã sửa: Lần 1, 2 thì hiện cảnh báo. Lần 3 là không thèm cảnh báo nữa mà phạt luôn.
          if (newCount < 3) {
            setShowCheatWarning(true); 
          }
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [assignment, resultData, isSubmitting]);

  useEffect(() => {
    // 🎯 Đã sửa: Lớn hơn hoặc BẰNG 3 là auto nộp điểm 0
    if (tabSwitchCount >= 3 && !resultData && !isSubmitting) {
      handleCheatSubmit();
    }
  }, [tabSwitchCount]);

  const handleCheatSubmit = async () => {
    setShowCheatWarning(false);
    setShowConfirmModal(false);
    setIsSubmitting(true);
    
    const timeSpentSec = assignment?.time_limit_min ? (assignment.time_limit_min * 60) - (timeLeft || 0) : 0;
    const res = await submitAssignmentAction(assignmentId, {}, timeSpentSec);
    
    if (res.success) { 
      setResultData({
        correctCount: 0,
        totalQuestions: questions.length,
        needsManualGrading: false,
        isCheated: true 
      });
    } else {
      alert('Lỗi hệ thống khi xử lý vi phạm.');
    }
    setIsSubmitting(false);
  };
  // ========================================================

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
    
    const timeSpentSec = assignment?.time_limit_min ? (assignment.time_limit_min * 60) - (timeLeft || 0) : 0;
    const res = await submitAssignmentAction(assignmentId, answersRef.current, timeSpentSec);
    
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
        <div className={`p-10 rounded-[3rem] border-b-8 text-center max-w-lg w-full shadow-2xl ${resultData.isCheated ? 'bg-slate-900 border-rose-600 border-rose-500/50' : 'bg-slate-800 border-sky-500 border-slate-700'}`}>
          {resultData.isCheated ? (
            <>
              <div className="text-8xl mb-6 drop-shadow-lg animate-bounce">🚨</div>
              <h2 className="text-3xl font-black text-rose-500 mb-4">VI PHẠM QUY CHẾ</h2>
              <p className="text-slate-400 mb-8 font-medium">Hệ thống phát hiện bạn đã chuyển tab quá số lần quy định. Bài thi đã bị hủy và tự động ghi nhận 0 điểm.</p>
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 mb-8 text-rose-500">
                <p className="font-black text-6xl">0<span className="text-3xl opacity-50">/10</span></p>
              </div>
            </>
          ) : (
            <>
              <div className="text-8xl mb-6 drop-shadow-lg">🎉</div>
              <h2 className="text-3xl font-black text-white mb-6">Nộp bài thành công!</h2>
              {resultData.needsManualGrading ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 mb-8 text-amber-400 font-medium">
                  <span className="text-2xl block mb-2">✍️</span>
                  Bài thi của bạn có câu hỏi tự luận. Vui lòng chờ Thầy/Cô chấm bài để biết kết quả cuối cùng nhé!
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-slate-700 rounded-3xl p-8 mb-8 shadow-inner">
                  <p className="text-slate-500 font-black uppercase tracking-widest mb-4 text-xs">SỐ CÂU TRẢ LỜI ĐÚNG</p>
                  <div className="flex items-baseline justify-center font-black gap-1">
                    <span className="text-7xl text-sky-400 tracking-tight drop-shadow-md">{resultData.correctCount}</span>
                    <span className="text-4xl text-sky-500/50">/{resultData.totalQuestions}</span>
                  </div>
                </div>
              )}
            </>
          )}
          <button onClick={() => router.push(`/classes/${assignment?.class_id}`)} className="w-full py-5 bg-slate-700 hover:bg-slate-600 text-white text-lg font-black rounded-2xl transition-all shadow-[0_6px_0_rgb(51,65,85)] active:translate-y-[4px] active:shadow-none">TRỞ VỀ LỚP HỌC</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto pb-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start px-4 lg:px-8 relative">
      <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-8">
        {assignment?.assignment_type !== 'homework' && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-rose-500 text-xl">⚠️</span>
            <div>
              <p className="text-rose-500 font-bold text-xs uppercase tracking-widest mb-1">CHẾ ĐỘ THI NGHIÊM NGẶT</p>
              <p className="text-slate-400 text-xs font-medium">Hệ thống đang giám sát. Chuyển tab bài thi 3 lần sẽ bị 0 điểm.</p>
            </div>
          </div>
        )}

        {timeLeft !== null && (
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl">
            <div className={`text-center p-4 rounded-2xl border-2 transition-colors ${timeLeft < 300 ? 'bg-rose-500/10 border-rose-500/50 text-rose-500 animate-pulse' : 'bg-sky-500/10 border-sky-500/30 text-sky-400'}`}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Thời gian còn lại</p>
              <p className="text-4xl font-black font-mono">{formatTime(timeLeft)}</p>
            </div>
          </div>
        )}

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
          <button onClick={() => setShowConfirmModal(true)} disabled={isSubmitting} className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-400 shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-[4px] active:shadow-none disabled:opacity-50">
            {isSubmitting ? 'ĐANG XỬ LÝ...' : '🚀 NỘP BÀI THI'}
          </button>
        </div>
      </div>

      <div className="lg:col-span-9 space-y-6">
        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl">
          <h1 className="text-2xl font-black text-white mb-2">{assignment?.title}</h1>
          <p className="text-slate-400 text-sm leading-relaxed">{assignment?.description}</p>
        </div>

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

      {showCheatWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm"></div>
          <div className="relative bg-slate-800 rounded-[2rem] border border-rose-500/50 p-8 max-w-md w-full shadow-2xl text-center transform animate-bounce">
            <div className="text-6xl mb-4">👀</div>
            <h3 className="text-2xl font-black text-rose-500 mb-2">CẢNH BÁO GIAN LẬN!</h3>
            <p className="text-slate-300 text-base mb-2">Bạn vừa chuyển khỏi màn hình làm bài.</p>
            <p className="text-rose-400 font-bold mb-8 bg-rose-500/10 py-2 rounded-xl border border-rose-500/20">
              Vi phạm lần {tabSwitchCount}. Lần 3 sẽ bị hủy bài!
            </p>
            <button 
              onClick={() => setShowCheatWarning(false)}
              className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-rose-500/20"
            >
              TÔI ĐÃ HIỂU VÀ SẼ KHÔNG TÁI PHẠM
            </button>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
          <div className="relative bg-slate-800 rounded-[2rem] border border-slate-700 p-8 max-w-sm w-full shadow-2xl text-center transform animate-fade-in-up">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-2xl font-black text-white mb-2">Chốt nộp bài?</h3>
            <p className="text-slate-400 text-sm mb-8">Hệ thống sẽ ghi nhận kết quả ngay lập tức và bạn không thể sửa lại đáp án.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors">Làm tiếp</button>
              <button onClick={handleFinalSubmit} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20">Nộp bài ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}