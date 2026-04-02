'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClassStudentsAction, addStudentToClassAction, removeStudentAction } from '@/modules/classes/controller/class.action';
import { getClassMaterialsAction } from '@/modules/classes/controller/class.action';
import ClassAnnouncementPage from './ClassAnnouncementPage'; 

import { getCourseQuestionsAction } from '@/modules/courses/controller/question.action';
import { createAssignmentAction, getClassAssignmentsAction, getCourseIdOfClassAction } from '@/modules/assignments/controller/assignment.action';

export default function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const resolvedParams = use(params);
  const classId = parseInt(resolvedParams.classId);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'announcements' | 'students' | 'quizzes' | 'materials'>('students');
  
  // States cho Tab Bài tập & Quiz
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [courseQuestions, setCourseQuestions] = useState<any[]>([]);
  const [selectedQIds, setSelectedQIds] = useState<number[]>([]);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);


  // States cho Tab Học Sinh
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState('');

  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  
  const loadStudents = async () => {
    setIsLoading(true);
    const res = await getClassStudentsAction(classId);
    if (res.success) setStudents(res.data);
    setIsLoading(false);
  };

  const loadMaterials = async () => {
    setIsLoadingMaterials(true);
    const res = await getClassMaterialsAction(classId);
    if (res.success) setMaterials(res.data);
    setIsLoadingMaterials(false);
  };

  // Cập nhật lại useEffect để tự động tải khi bấm sang Tab 4
  useEffect(() => {
    if (activeTab === 'students') loadStudents();
    if (activeTab === 'materials') loadMaterials();
  }, [activeTab, classId]);

  // Xử lý thêm học sinh
  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAdding(true);
    setMessage('');
    const formData = new FormData(e.currentTarget);
    formData.append('class_id', classId.toString());
    const res = await addStudentToClassAction(formData);
    setMessage(res.message);
    if (res.success) {
      (e.target as HTMLFormElement).reset();
      loadStudents();
    }
    setIsAdding(false);
  };

  // 🎯 Xử lý xóa học sinh 
  const handleRemoveStudent = async (studentId: number, studentName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa học sinh ${studentName} khỏi lớp không?`)) {
      const res = await removeStudentAction(classId, studentId);
      if (res.success) {
        setStudents(prev => prev.filter(s => s.student_id !== studentId)); // Xóa trên UI
      } else {
        alert(res.message);
      }
    }
  };


  const loadClassData = async () => {
    setIsLoading(true);
    const [studentsRes, assignsRes] = await Promise.all([
      getClassStudentsAction(classId),
      getClassAssignmentsAction(classId)
    ]);
    if (studentsRes.success) setStudents(studentsRes.data);
    if (assignsRes.success) setAssignments(assignsRes.data);
    setIsLoading(false);
  };

  useEffect(() => { loadClassData(); }, [classId]);

  // 4. HÀM MỞ MODAL & LOAD NGÂN HÀNG CÂU HỎI
  const handleOpenQuizModal = async () => {
    setIsQuizModalOpen(true);
    setSelectedQIds([]); // Reset lựa chọn cũ
    
    // Tìm xem lớp này thuộc Khóa học nào
    const courseRes = await getCourseIdOfClassAction(classId);
    if (courseRes.success && courseRes.courseId) {
      // Load câu hỏi từ Khóa học đó ra
      const qRes = await getCourseQuestionsAction(courseRes.courseId);
      if (qRes.success) setCourseQuestions(qRes.data);
    }
  };

  // Nút tick chọn câu hỏi
  const handleToggleQuestion = (qId: number) => {
    setSelectedQIds(prev => prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]);
  };

  // 5. HÀM SUBMIT TẠO BÀI TẬP
  const handleCreateAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingQuiz(true);
    setMessage('');
    
    const formData = new FormData(e.currentTarget);
    formData.append('class_id', classId.toString());

    const res = await createAssignmentAction(formData, selectedQIds);
    setMessage(res.message);
    if (res.success) {
      loadClassData();
      setTimeout(() => setIsQuizModalOpen(false), 1500);
    }
    setIsSubmittingQuiz(false);
  };

  
  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* HEADER LỚP HỌC */}
      <button onClick={() => router.push('/classes')} className="mb-6 font-bold text-gray-500 hover:text-sky-500 flex items-center gap-2 transition-colors">
        <span>⬅</span> Quay lại danh sách lớp
      </button>

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl shadow-xl p-8 mb-8 border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center text-4xl border-2 border-blue-500/50 shadow-inner">🏫</div>
          <div>
            <p className="text-blue-400 font-black text-sm uppercase tracking-widest mb-1">ID Lớp: #{classId}</p>
            <h1 className="text-3xl font-extrabold text-white">Quản Lý Lớp Học</h1>
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG TABS */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => setActiveTab('announcements')} className={`px-6 py-3 font-bold rounded-2xl transition-all whitespace-nowrap ${activeTab === 'announcements' ? 'bg-sky-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>📢 Thông báo & Bài đăng</button>
        <button onClick={() => setActiveTab('students')} className={`px-6 py-3 font-bold rounded-2xl transition-all whitespace-nowrap ${activeTab === 'students' ? 'bg-purple-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>👥 Danh sách Học sinh</button>
        <button onClick={() => setActiveTab('quizzes')} className={`px-6 py-3 font-bold rounded-2xl transition-all whitespace-nowrap ${activeTab === 'quizzes' ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>📝 Bài tập & Quiz</button>
        <button onClick={() => setActiveTab('materials')} className={`px-6 py-3 font-bold rounded-2xl transition-all whitespace-nowrap ${activeTab === 'materials' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>📚 Kho Học liệu</button>
      </div>

      {/* ========================================== */}
      {/* NỘI DUNG CÁC TABS */}
      {/* ========================================== */}

      {/* TAB 1: THÔNG BÁO */}
      {activeTab === 'announcements' && <ClassAnnouncementPage classId={classId} />}

      {/* TAB 2: QUẢN LÝ HỌC SINH */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 sticky top-8 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><span>➕</span> Thêm học sinh</h2>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Mã học sinh (ID)</label>
                  <input name="student_code" required placeholder="VD: HS10293..." className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl focus:outline-none focus:border-purple-500 text-white font-mono uppercase transition-colors" />
                </div>
                {message && <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.includes('thành công') || message.includes('🎉') ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>{message}</div>}
                <button type="submit" disabled={isAdding} className="w-full py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50">
                  {isAdding ? '⏳ ĐANG THÊM...' : 'THÊM VÀO LỚP'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="text-center py-20 text-slate-400 animate-pulse font-bold">Đang tải danh sách lớp...</div>
            ) : students.length === 0 ? (
              <div className="bg-slate-800 rounded-3xl p-12 text-center border border-slate-700 border-dashed">
                <span className="text-5xl block mb-4">👻</span>
                <p className="text-slate-400 font-bold">Lớp học này chưa có học sinh nào.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex justify-between">
                  <span className="text-slate-400 font-bold text-sm">Sĩ số hiện tại: <span className="text-purple-400 text-lg">{students.length}</span></span>
                </div>
                {students.map((student) => (
                  <div key={student.student_id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex items-center justify-between hover:border-purple-500/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-700 rounded-full overflow-hidden flex items-center justify-center text-xl">
                        {student.avatar_url ? <img src={student.avatar_url} alt="avt" className="w-full h-full object-cover" /> : '🐶'}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{student.name}</h3>
                        <p className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded mt-1 inline-block">{student.student_code}</p>
                      </div>
                    </div>
                    {/* 🎯 Nút Xóa đã được gắn hàm */}
                    <button onClick={() => handleRemoveStudent(student.student_id, student.name)} className="w-10 h-10 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors" title="Xóa khỏi lớp">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BÀI TẬP VÀ QUIZ */}
      {activeTab === 'quizzes' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><span>📝</span> Bài Tập Giao Cho Lớp</h2>
            <button onClick={handleOpenQuizModal} className="px-6 py-3 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-all shadow-[0_4px_0_rgb(217,119,6)] active:translate-y-[2px] active:shadow-none">
              ➕ Soạn Bài Tập Mới
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="bg-slate-800 rounded-3xl p-12 text-center border border-slate-700 border-dashed">
              <span className="text-6xl mb-4 block">🎯</span>
              <h3 className="text-xl font-bold text-slate-300 mb-2">Chưa có bài tập nào được giao</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((ass) => (
                <div key={ass.assignment_id} className="bg-slate-800 rounded-3xl p-6 border border-slate-700 hover:border-amber-500/50 transition-colors group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center text-2xl font-bold">Q</div>
                    <div>
                      <h3 className="font-bold text-white text-lg line-clamp-1">{ass.title}</h3>
                      <p className="text-xs font-medium text-slate-400">{ass.assignment_type.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm font-medium text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <p>🕒 Thời gian: <span className="text-amber-400">{ass.time_limit_min ? `${ass.time_limit_min} phút` : 'Không giới hạn'}</span></p>
                    <p>📊 Số câu hỏi: <span className="text-emerald-400">{ass.question_count} câu</span></p>
                    <p>📅 Hạn chót: <span className="text-rose-400">{ass.due_date ? new Date(ass.due_date).toLocaleDateString('vi-VN') : 'Không có'}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🚀 MODAL TẠO BÀI TẬP SIÊU TO KHỔNG LỒ */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-800 rounded-3xl w-full max-w-6xl shadow-2xl border border-slate-700 flex flex-col max-h-[95vh] overflow-hidden">
            <div className="p-6 bg-amber-500 text-white flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-bold flex items-center gap-2"><span>🎯</span> Thiết lập Bài tập / Đề thi</h2>
              <button onClick={() => setIsQuizModalOpen(false)} className="text-white hover:rotate-90 transition-transform text-2xl">✖</button>
            </div>
            
            <form onSubmit={handleCreateAssignment} className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* CỘT TRÁI: Cài đặt thông số */}
              <div className="w-full lg:w-1/3 p-6 border-r border-slate-700 overflow-y-auto bg-slate-800/50">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Tiêu đề bài tập *</label>
                    <input name="title" required placeholder="VD: Kiểm tra 15 phút Chương 1" className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl focus:outline-none focus:border-amber-500 text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Loại bài</label>
                      <select name="assignment_type" className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white font-bold outline-none">
                        <option value="homework">Bài tập về nhà</option>
                        <option value="quiz">Quiz (Kiểm tra)</option>
                        <option value="midterm">Thi Giữa kỳ</option>
                        <option value="final">Thi Cuối kỳ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Thời gian làm (Phút)</label>
                      <input name="time_limit_min" type="number" placeholder="Bỏ trống nếu ko giới hạn" className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Hạn chót nộp bài</label>
                    <input name="due_date" type="datetime-local" className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Lời dặn dò</label>
                    <textarea name="description" rows={3} placeholder="Chú ý làm bài cẩn thận nhé..." className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white outline-none resize-none"></textarea>
                  </div>
                                    
                  <button type="submit" disabled={isSubmittingQuiz} className="w-full py-4 mt-2 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50">
                    {isSubmittingQuiz ? '⏳ ĐANG LƯU...' : `🚀 GIAO BÀI (${selectedQIds.length} Câu hỏi)`}
                  </button>
                </div>
              </div>

              {/* CỘT PHẢI: Ngân hàng câu hỏi (Để tick chọn) */}
              <div className="w-full lg:w-2/3 p-6 overflow-y-auto bg-slate-900 relative">
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-900/90 backdrop-blur pb-2 z-10">
                  <h3 className="text-xl font-bold text-white">Ngân hàng đề của Khóa học</h3>
                  <span className="px-4 py-1.5 bg-amber-500/20 text-amber-400 font-bold rounded-full border border-amber-500/30">
                    Đã chọn: {selectedQIds.length} câu
                  </span>
                </div>

                {courseQuestions.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 font-bold border-2 border-dashed border-slate-700 rounded-3xl">
                    Chưa có câu hỏi nào trong Khóa học này.<br/>Hãy sang mục Khóa Học để soạn đề trước nhé!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courseQuestions.map((q, idx) => (
                      <label key={q.question_id} className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedQIds.includes(q.question_id) ? 'bg-amber-500/10 border-amber-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
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
                            <span className="px-2 py-0.5 bg-slate-700 text-xs font-bold rounded text-slate-300">Chương {q.chapter || '?'}</span>
                            <span className="px-2 py-0.5 bg-purple-500/20 text-xs font-bold rounded text-purple-400">Độ khó: {q.difficulty}</span>
                          </div>
                          <p className="font-bold text-white text-base leading-relaxed line-clamp-3">{q.content?.text || 'Nội dung câu hỏi...'}</p>
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

      {/* TAB 4: KHO HỌC LIỆU */}
      {activeTab === 'materials' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><span>📚</span> Kho Học Liệu</h2>
            <button className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-[2px] active:shadow-none">
              ➕ Tải thêm tài liệu Lớp
            </button>
          </div>

          {isLoadingMaterials ? (
            <div className="text-center py-20 text-slate-400 animate-pulse font-bold">Đang tải kho học liệu...</div>
          ) : materials.length === 0 ? (
            <div className="bg-slate-800 rounded-3xl p-12 text-center border border-slate-700 border-dashed">
              <span className="text-6xl mb-4 block">📂</span>
              <h3 className="text-xl font-bold text-slate-300 mb-2">Chưa có tài liệu nào</h3>
              <p className="text-slate-500">Khóa học gốc chưa có tài liệu. Hãy sang mục Quản lý Khóa học để thêm nhé.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.map((doc) => (
                <div key={doc.document_id} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex items-center justify-between hover:border-emerald-500/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center text-xl font-bold uppercase border border-emerald-500/30">
                      {doc.doc_type === 'video' ? '🎥' : (doc.file_ext || '📄')}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg line-clamp-1">{doc.title}</h4>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded font-bold ${doc.course_id ? 'text-sky-400 bg-sky-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                          {doc.course_id ? '🌐 Của Khóa Học' : '📌 Của Lớp Này'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Các nút Xem / Tải về hiện lên khi Hover */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {doc.storage_url && doc.storage_url !== '#' && (
                      <>
                        <a href={doc.storage_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-700 text-sky-400 rounded-full flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all shadow-sm" title="Xem tài liệu">👁️</a>
                        <a href={`${doc.storage_url}?download=1`} className="w-10 h-10 bg-slate-700 text-emerald-400 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm" title="Tải xuống máy">⬇️</a>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}