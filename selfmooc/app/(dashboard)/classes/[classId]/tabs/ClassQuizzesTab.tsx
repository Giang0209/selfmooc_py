'use client';

import { useEffect, useState } from 'react';
import { getCourseQuestionsAction } from '@/modules/courses/controller/question.action';
import { createAssignmentAction, getClassAssignmentsAction, getCourseIdOfClassAction, updateAssignmentAction, getAssignmentSelectedQuestionsAction } from '@/modules/assignments/controller/assignment.action';

export default function ClassQuizzesTab({ classId }: { classId: number }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [courseQuestions, setCourseQuestions] = useState<any[]>([]);
  const [selectedQIds, setSelectedQIds] = useState<number[]>([]);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadAssignments = async () => {
    setIsLoading(true);
    const res = await getClassAssignmentsAction(classId);
    if (res.success) setAssignments(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAssignments();
  }, [classId]);

  const handleOpenQuizModal = async () => {
    setIsQuizModalOpen(true);
    setEditingAssignment(null);
    setSelectedQIds([]); 
    const courseRes = await getCourseIdOfClassAction(classId);
    if (courseRes.success && courseRes.courseId) {
      const qRes = await getCourseQuestionsAction(courseRes.courseId);
      if (qRes.success) setCourseQuestions(qRes.data);
    }
  };

  const handleEditAssignment = async (ass: any) => {
    setIsQuizModalOpen(true);
    setEditingAssignment(ass);
    const courseRes = await getCourseIdOfClassAction(classId);
    if (courseRes.success && courseRes.courseId) {
      const qRes = await getCourseQuestionsAction(courseRes.courseId);
      if (qRes.success) setCourseQuestions(qRes.data);
    }
    const selectedRes = await getAssignmentSelectedQuestionsAction(ass.assignment_id);
    if (selectedRes.success) setSelectedQIds(selectedRes.data);
  };

  const handleToggleQuestion = (qId: number) => {
    setSelectedQIds(prev => prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]);
  };

  const handleSubmitQuizForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingQuiz(true);
    setMessage('');
    try {
      const formData = new FormData(e.currentTarget);
      formData.append('class_id', classId.toString());
      let res;
      if (editingAssignment) {
        res = await updateAssignmentAction(editingAssignment.assignment_id, formData, selectedQIds);
      } else {
        res = await createAssignmentAction(formData, selectedQIds);
      }
      setMessage(res.message);
      if (res.success) {
        loadAssignments();
        setTimeout(() => {
          setIsQuizModalOpen(false);
          setEditingAssignment(null);
          setMessage('');
        }, 1500);
      }
    } catch (error) {
      setMessage('❌ Đã xảy ra lỗi hệ thống khi lưu!');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><span>📝</span> Bài Tập Giao Cho Lớp</h2>
        <button onClick={handleOpenQuizModal} className="px-6 py-3 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-all shadow-[0_4px_0_rgb(217,119,6)] active:translate-y-[2px] active:shadow-none">
          ➕ Soạn Bài Tập Mới
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-amber-500 animate-pulse font-bold">Đang tải bài tập...</div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-gray-100 border-dashed shadow-sm">
          <span className="text-6xl mb-4 block grayscale opacity-50">🎯</span>
          <h3 className="text-xl font-bold text-gray-400 mb-2">Chưa có bài tập nào được giao</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((ass) => (
            <div key={ass.assignment_id} className="bg-white rounded-3xl p-6 border-2 border-gray-100 hover:border-amber-300 shadow-sm transition-colors group relative">
              <button onClick={() => handleEditAssignment(ass)} className="absolute top-4 right-4 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-500 hover:text-white font-bold" title="Sửa bài tập">
                ✏️
              </button>

              <div className="flex items-center gap-4 mb-4 pr-10">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-2xl font-bold border border-amber-200">Q</div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{ass.title}</h3>
                  <p className="text-xs font-bold text-gray-400">{ass.assignment_type.toUpperCase()}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm font-bold text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p>🕒 Thời gian: <span className="text-amber-600">{ass.time_limit_min ? `${ass.time_limit_min} phút` : 'Không giới hạn'}</span></p>
                <p>📊 Số câu hỏi: <span className="text-emerald-600">{ass.question_count} câu</span></p>
                <p>🔄 Lần làm: <span className="text-sky-600">{ass.max_attempts ? `Tối đa ${ass.max_attempts} lần` : 'Vô hạn'}</span></p>
                <p>📅 Hạn chót: <span className="text-rose-500">{ass.due_date ? new Date(ass.due_date).toLocaleDateString('vi-VN') : 'Không có'}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TẠO & SỬA BÀI TẬP */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl border border-gray-200 flex flex-col max-h-[95vh] overflow-hidden">
            <div className="p-6 bg-amber-500 text-white flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>🎯</span> {editingAssignment ? 'Chỉnh sửa Bài tập' : 'Thiết lập Bài tập / Đề thi'}
              </h2>
              <button onClick={() => { setIsQuizModalOpen(false); setEditingAssignment(null); setMessage(''); }} className="text-white hover:rotate-90 transition-transform text-2xl font-bold">✖</button>
            </div>
            
            <form onSubmit={handleSubmitQuizForm} className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              
              {/* CỘT TRÁI: Cài đặt thông số */}
              <div className="w-full lg:w-1/3 p-6 border-r border-gray-200 overflow-y-auto bg-gray-50">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề bài tập *</label>
                    <input name="title" defaultValue={editingAssignment?.title} required placeholder="VD: Kiểm tra 15 phút Chương 1" className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-gray-800 font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Loại bài</label>
                      <select name="assignment_type" defaultValue={editingAssignment?.assignment_type || 'homework'} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-bold outline-none focus:border-amber-500">
                        <option value="homework">Bài tập về nhà</option>
                        <option value="quiz">Quiz (Kiểm tra)</option>
                        <option value="midterm">Thi Giữa kỳ</option>
                        <option value="final">Thi Cuối kỳ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Thời gian (Phút)</label>
                      <input name="time_limit_min" defaultValue={editingAssignment?.time_limit_min} type="number" placeholder="Vô hạn" className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-bold outline-none focus:border-amber-500" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Lần làm tối đa</label>
                      <input name="max_attempts" defaultValue={editingAssignment?.max_attempts} type="number" min="1" placeholder="Vô hạn" className="w-full px-4 py-3 bg-white border-2 border-amber-200 focus:border-amber-500 rounded-xl text-gray-800 font-bold outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Hạn chót nộp bài</label>
                      <input name="due_date" defaultValue={editingAssignment?.due_date ? new Date(new Date(editingAssignment.due_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} type="datetime-local" className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-bold outline-none text-xs focus:border-amber-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Lời dặn dò</label>
                    <textarea name="description" defaultValue={editingAssignment?.description} rows={3} placeholder="Chú ý làm bài cẩn thận nhé..." className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium outline-none resize-none focus:border-amber-500"></textarea>
                  </div>
                  
                  {message && (
                    <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.includes('✅') ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                      {message}
                    </div>
                  )}
                  
                  <button type="submit" disabled={isSubmittingQuiz} className="w-full py-4 mt-2 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-[0_4px_0_rgb(217,119,6)] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:shadow-none">
                    {isSubmittingQuiz ? '⏳ ĐANG LƯU...' : (editingAssignment ? `💾 LƯU THAY ĐỔI (${selectedQIds.length} Câu)` : `🚀 GIAO BÀI (${selectedQIds.length} Câu)`)}
                  </button>
                </div>
              </div>

              {/* CỘT PHẢI: Ngân hàng câu hỏi */}
              <div className="w-full lg:w-2/3 p-6 overflow-y-auto bg-white relative">
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-white/90 backdrop-blur pb-2 z-10 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800">Ngân hàng đề của Khóa học</h3>
                  <span className="px-4 py-1.5 bg-amber-100 text-amber-600 font-bold rounded-full border border-amber-200 text-sm">
                    Đã chọn: {selectedQIds.length} câu
                  </span>
                </div>

                {courseQuestions.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-3xl">
                    Chưa có câu hỏi nào trong Khóa học này.<br/>Hãy sang mục Khóa Học để soạn đề trước nhé!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courseQuestions.map((q) => (
                      <label key={q.question_id} className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedQIds.includes(q.question_id) ? 'bg-amber-50 border-amber-400 shadow-sm' : 'bg-white border-gray-200 hover:border-amber-300'}`}>
                        <div className="pt-1">
                          <input 
                            type="checkbox" 
                            className="w-6 h-6 accent-amber-500 cursor-pointer"
                            checked={selectedQIds.includes(q.question_id)}
                            onChange={() => handleToggleQuestion(q.question_id)}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-gray-100 text-xs font-bold rounded text-gray-500 border border-gray-200">Chương {q.chapter || '?'}</span>
                            <span className="px-2 py-0.5 bg-purple-50 text-xs font-bold rounded text-purple-600 border border-purple-200">Độ khó: {q.difficulty}</span>
                          </div>
                          <p className="font-bold text-gray-800 text-base leading-relaxed line-clamp-3">{q.content?.text || 'Nội dung câu hỏi...'}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}