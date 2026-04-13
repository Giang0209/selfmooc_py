'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClassStudentsAction, addStudentToClassAction, removeStudentAction, getClassAttendanceAction } from '@/modules/classes/controller/class.action';
import { getClassMaterialsAction } from '@/modules/classes/controller/class.action';
import ClassAnnouncementPage from './ClassAnnouncementPage'; 

import { getCourseQuestionsAction } from '@/modules/courses/controller/question.action';
import { createAssignmentAction, getClassAssignmentsAction, getCourseIdOfClassAction, updateAssignmentAction, getAssignmentSelectedQuestionsAction } from '@/modules/assignments/controller/assignment.action';
import { saveBulkAttendanceAction, getAttendanceHistoryAction } from '@/modules/classes/controller/class.action';
import { addStudentsToClassAction } from '@/modules/classes/controller/enrollment.action';


export default function TeacherClassDetailPage ({ params }: { params: Promise<{ classId: string }> }) {
  const resolvedParams = use(params);
  const classId = parseInt(resolvedParams.classId);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'announcements' | 'students' | 'quizzes' | 'materials' | 'attendance'>('students');
  
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
  
  // --- STATE CHO ĐIỂM DANH ---
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]); // State cho Lịch sử
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const [editingAssignment, setEditingAssignment] = useState<any>(null);


  // State import xlsx
  const [selectedExcel, setSelectedExcel] = useState<File | null>(null);
  
  const loadAttendanceData = async () => {
    setIsLoadingAttendance(true);
    // Gọi song song cả danh sách điểm danh hôm nay VÀ lịch sử cũ
    const [todayRes, historyRes] = await Promise.all([
      getClassAttendanceAction(classId),
      getAttendanceHistoryAction(classId)
    ]);
    if (todayRes.success) setAttendanceList(todayRes.data);
    if (historyRes.success) setAttendanceHistory(historyRes.data);
    setIsLoadingAttendance(false);
  };

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

  useEffect(() => {
    if (activeTab === 'students') loadStudents();
    if (activeTab === 'materials') loadMaterials();
    if (activeTab === 'attendance') loadAttendanceData();
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
    setEditingAssignment(null); // Reset trạng thái sửa
    setSelectedQIds([]); 
    
    const courseRes = await getCourseIdOfClassAction(classId);
    if (courseRes.success && courseRes.courseId) {
      const qRes = await getCourseQuestionsAction(courseRes.courseId);
      if (qRes.success) setCourseQuestions(qRes.data);
    }
  };

  // Nút tick chọn câu hỏi
  const handleToggleQuestion = (qId: number) => {
    setSelectedQIds(prev => prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]);
  };

  // 🎯 HÀM XỬ LÝ KHI BẤM NÚT LƯU/GIAO BÀI
  const handleSubmitQuizForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Chặn việc trình duyệt tự reload trang
    setIsSubmittingQuiz(true);
    setMessage('');
    
    try {
      const formData = new FormData(e.currentTarget);
      formData.append('class_id', classId.toString());

      let res;
      if (editingAssignment) {
        // ĐANG SỬA BÀI -> Gọi API Update
        res = await updateAssignmentAction(editingAssignment.assignment_id, formData, selectedQIds);
      } else {
        // ĐANG TẠO MỚI -> Gọi API Create
        res = await createAssignmentAction(formData, selectedQIds);
      }

      setMessage(res.message);
      if (res.success) {
        loadClassData(); // Load lại danh sách ngoài UI
        setTimeout(() => {
          setIsQuizModalOpen(false);
          setEditingAssignment(null); // Reset lại trạng thái
          setMessage('');
        }, 1500);
      }
    } catch (error) {
      setMessage('❌ Đã xảy ra lỗi hệ thống khi lưu!');
      console.error(error);
    } finally {
      setIsSubmittingQuiz(false); // Mở khóa nút bấm
    }
  };

  const handleEditAssignment = async (ass: any) => {
    setIsQuizModalOpen(true);
    setEditingAssignment(ass); // Lưu lại dữ liệu bài tập vào state để fill vào input
    
    // 1. Load ngân hàng câu hỏi
    const courseRes = await getCourseIdOfClassAction(classId);
    if (courseRes.success && courseRes.courseId) {
      const qRes = await getCourseQuestionsAction(courseRes.courseId);
      if (qRes.success) setCourseQuestions(qRes.data);
    }

    // 2. Load các câu hỏi đã chọn từ DB để tick sẵn vào UI
    const selectedRes = await getAssignmentSelectedQuestionsAction(ass.assignment_id);
    if (selectedRes.success) setSelectedQIds(selectedRes.data);
  };

  // Click trên giao diện chỉ đổi State ảo (Chưa lưu DB)
  const handleToggleLocalAttendance = (studentId: number, currentStatus: string) => {
    setAttendanceList(prev => prev.map(item => 
      item.student_id === studentId 
        ? { 
            ...item, 
            today_status: currentStatus === 'present' ? 'absent' : 'present',
            // Nhảy số hiển thị cho trực quan
            total_absences: currentStatus === 'present' ? Number(item.total_absences) + 1 : Number(item.total_absences) - 1 
          } 
        : item
    ));
  };

  // HÀM 2: Bấm nút Submit mới lưu toàn bộ
  const handleSaveAttendanceSubmit = async () => {
    setIsSavingAttendance(true);
    // Lọc ra mảng chỉ chứa ID và Status để gửi lên Server
    const recordsToSave = attendanceList.map(item => ({
      student_id: item.student_id,
      status: item.today_status
    }));

    const res = await saveBulkAttendanceAction(classId, recordsToSave);
    if (res.success) {
      alert(res.message);
      loadAttendanceData(); // Load lại để cập nhật Lịch sử
    } else {
      alert(res.message);
    }
    setIsSavingAttendance(false);
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
        <button onClick={() => setActiveTab('attendance')} className={`px-6 py-3 font-bold rounded-2xl transition-all whitespace-nowrap ${activeTab === 'attendance' ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>✅ Điểm danh</button>
      </div>

      {/* ========================================== */}
      {/* NỘI DUNG CÁC TABS */}
      {/* ========================================== */}

      {/* TAB 1: THÔNG BÁO */}
      {activeTab === 'announcements' && <ClassAnnouncementPage classId={classId} />}

      {/* TAB 2: QUẢN LÝ HỌC SINH */}
      {activeTab === 'students' && (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
    <div className="lg:col-span-1 space-y-6">
      
      {/* KHỐI 1: NHẬP THỦ CÔNG (Giữ nguyên ý muốn của bạn) */}
      <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><span>⌨️</span> Nhập mã thủ công</h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          setIsAdding(true);
          const fd = new FormData(e.currentTarget);
          const res = await addStudentsToClassAction(classId, 'manual', { student_code: fd.get('student_code') });
          setMessage(res.message);
          if (res.success) loadClassData();
          setIsAdding(false);
        }} className="space-y-4">
          <input name="student_code" required placeholder="Nhập MSSV..." className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white font-mono uppercase focus:border-purple-500 outline-none" />
          <button type="submit" disabled={isAdding} className="w-full py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all">THÊM NHANH</button>
        </form>
      </div>

      {/* KHỐI 2: IMPORT EXCEL */}
      <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><span>📊</span> Import Excel</h2>
        <p className="text-[10px] text-slate-500 mb-4 uppercase font-black">File cần có cột: MSSV, HoTen</p>
        
        <form onSubmit={async (e) => {
          e.preventDefault();
          setIsAdding(true);
          const fd = new FormData(e.currentTarget);
          const res = await addStudentsToClassAction(classId, 'excel', fd.get('file'));
          setMessage(res.message);
          
          if (res.success) {
            loadClassData();
            setSelectedExcel(null); // 🎯 Reset file sau khi upload thành công
            (e.target as HTMLFormElement).reset(); 
          }
          setIsAdding(false);
        }} className="space-y-4">
          
          {/* Khu vực Upload có trạng thái File */}
          <div className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all bg-slate-900/30 ${selectedExcel ? 'border-emerald-500/50' : 'border-slate-700 hover:border-purple-500'}`}>
            <input 
              type="file" 
              name="file" 
              accept=".xlsx, .xls" 
              required 
              className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => {
                // 🎯 Lưu file vào state để hiển thị
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedExcel(e.target.files[0]);
                } else {
                  setSelectedExcel(null);
                }
              }}
            />
            
            {/* Nếu CÓ file -> Hiện Icon Excel, Nếu CHƯA -> Hiện chữ mặc định */}
            {selectedExcel ? (
              <div className="flex flex-col items-center justify-center animate-fade-in">
                <span className="text-4xl mb-2 drop-shadow-md">📗</span>
                <p className="text-sm font-bold text-emerald-400 line-clamp-1 px-2">{selectedExcel.name}</p>
                <p className="text-xs text-slate-500 mt-1">{(selectedExcel.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl mb-2">📁</span>
                <p className="text-xs text-slate-400 font-bold">Chọn file .xlsx</p>
              </div>
            )}
          </div>

          <button type="submit" disabled={isAdding || !selectedExcel} className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 shadow-[0_4px_0_rgb(126,34,206)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none">
            TẢI LÊN DANH SÁCH
          </button>
        </form>
      </div>
    </div>

          {/* CỘT PHẢI: HIỂN THỊ DANH SÁCH */}
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
                  <span className="text-slate-400 font-bold text-sm">Sĩ số hiện tại: <span className="text-sky-400 text-lg">{students.length}</span></span>
                </div>
                {students.map((student) => (
                  <div key={student.student_id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex items-center justify-between hover:border-sky-500/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-700 rounded-full overflow-hidden flex items-center justify-center text-xl">
                        {student.avatar_url ? <img src={student.avatar_url} alt="avt" className="w-full h-full object-cover" /> : '🐶'}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{student.name}</h3>
                        <p className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded mt-1 inline-block">{student.student_code}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveStudent(student.student_id, student.name)} className="w-10 h-10 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-400 transition-colors" title="Xóa khỏi lớp">
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
                <div key={ass.assignment_id} className="bg-slate-800 rounded-3xl p-6 border border-slate-700 hover:border-amber-500/50 transition-colors group relative">
                  
                  {/* Nút Sửa ẩn hiện khi Hover */}
                  <button onClick={() => handleEditAssignment(ass)} className="absolute top-4 right-4 w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-500 hover:text-white" title="Sửa bài tập">
                    ✏️
                  </button>

                  <div className="flex items-center gap-4 mb-4 pr-10">
                    <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center text-2xl font-bold">Q</div>
                    <div>
                      <h3 className="font-bold text-white text-lg line-clamp-1">{ass.title}</h3>
                      <p className="text-xs font-medium text-slate-400">{ass.assignment_type.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm font-medium text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <p>🕒 Thời gian: <span className="text-amber-400">{ass.time_limit_min ? `${ass.time_limit_min} phút` : 'Không giới hạn'}</span></p>
                    <p>📊 Số câu hỏi: <span className="text-emerald-400">{ass.question_count} câu</span></p>
                    {/* Hiển thị giới hạn số lần */}
                    <p>🔄 Lần làm: <span className="text-sky-400">{ass.max_attempts ? `Tối đa ${ass.max_attempts} lần` : 'Vô hạn'}</span></p>
                    <p>📅 Hạn chót: <span className="text-rose-400">{ass.due_date ? new Date(ass.due_date).toLocaleDateString('vi-VN') : 'Không có'}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🚀 MODAL TẠO & SỬA BÀI TẬP */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-800 rounded-3xl w-full max-w-6xl shadow-2xl border border-slate-700 flex flex-col max-h-[95vh] overflow-hidden">
            <div className="p-6 bg-amber-500 text-white flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>🎯</span> {editingAssignment ? 'Chỉnh sửa Bài tập' : 'Thiết lập Bài tập / Đề thi'}
              </h2>
              <button onClick={() => { setIsQuizModalOpen(false); setEditingAssignment(null); setMessage(''); }} className="text-white hover:rotate-90 transition-transform text-2xl">✖</button>
            </div>
            
            <form onSubmit={handleSubmitQuizForm} className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              
              {/* CỘT TRÁI: Cài đặt thông số */}
              <div className="w-full lg:w-1/3 p-6 border-r border-slate-700 overflow-y-auto bg-slate-800/50">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Tiêu đề bài tập *</label>
                    <input name="title" defaultValue={editingAssignment?.title} required placeholder="VD: Kiểm tra 15 phút Chương 1" className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl focus:outline-none focus:border-amber-500 text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Loại bài</label>
                      <select name="assignment_type" defaultValue={editingAssignment?.assignment_type || 'homework'} className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white font-bold outline-none">
                        <option value="homework">Bài tập về nhà</option>
                        <option value="quiz">Quiz (Kiểm tra)</option>
                        <option value="midterm">Thi Giữa kỳ</option>
                        <option value="final">Thi Cuối kỳ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Thời gian (Phút)</label>
                      <input name="time_limit_min" defaultValue={editingAssignment?.time_limit_min} type="number" placeholder="Vô hạn" className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white outline-none" />
                    </div>
                  </div>
                  
                  {/* GIỚI HẠN SỐ LẦN & HẠN CHÓT */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Số lần làm tối đa</label>
                      <input name="max_attempts" defaultValue={editingAssignment?.max_attempts} type="number" min="1" placeholder="Vô hạn" className="w-full px-4 py-3 bg-slate-900 border border-amber-500/50 focus:border-amber-500 rounded-xl text-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Hạn chót nộp bài</label>
                      {/* Xử lý định dạng ngày giờ cho input type="datetime-local" */}
                      <input name="due_date" defaultValue={editingAssignment?.due_date ? new Date(new Date(editingAssignment.due_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} type="datetime-local" className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white outline-none text-xs" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Lời dặn dò</label>
                    <textarea name="description" defaultValue={editingAssignment?.description} rows={3} placeholder="Chú ý làm bài cẩn thận nhé..." className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white outline-none resize-none"></textarea>
                  </div>
                  
                  {message && (
                    <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.includes('✅') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                      {message}
                    </div>
                  )}
                  
                  <button type="submit" disabled={isSubmittingQuiz} className="w-full py-4 mt-2 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50">
                    {isSubmittingQuiz ? '⏳ ĐANG LƯU...' : (editingAssignment ? `💾 LƯU THAY ĐỔI (${selectedQIds.length} Câu)` : `🚀 GIAO BÀI (${selectedQIds.length} Câu)`)}
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
                    {courseQuestions.map((q) => (
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

      {/* TAB 5: ĐIỂM DANH */}
      {activeTab === 'attendance' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* KHỐI 1: BẢNG ĐIỂM DANH HÔM NAY */}
          <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><span>📅</span> Chốt Điểm Danh Hôm Nay</h2>
                <p className="text-sm text-slate-400 mt-1">Ngày: {new Date().toLocaleDateString('vi-VN')} • Tích vào những bạn đi học</p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex gap-4 text-sm font-bold">
                  <span className="flex items-center gap-2 text-sky-400"><div className="w-4 h-4 rounded bg-sky-500/20 border border-sky-500 flex items-center justify-center text-xs">✓</div> Có mặt</span>
                  <span className="flex items-center gap-2 text-rose-400"><div className="w-4 h-4 rounded bg-rose-500/20 border border-rose-500"></div> Vắng mặt</span>
                </div>
                
                {/* 🚀 NÚT SUBMIT */}
                <button 
                  onClick={handleSaveAttendanceSubmit}
                  disabled={isSavingAttendance || attendanceList.length === 0}
                  className="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingAttendance ? '⏳ ĐANG LƯU...' : '💾 LƯU ĐIỂM DANH'}
                </button>
              </div>
            </div>

            {isLoadingAttendance ? (
              <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Đang chuẩn bị danh sách...</div>
            ) : attendanceList.length === 0 ? (
              <div className="text-center py-20 text-slate-500 font-bold">Lớp chưa có học sinh để điểm danh.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 text-slate-400 text-sm border-b border-slate-700">
                      <th className="p-4 font-bold text-center w-16">STT</th>
                      <th className="p-4 font-bold">Họ và tên</th>
                      <th className="p-4 font-bold">MSSV</th>
                      <th className="p-4 font-bold text-center">Trạng thái (Click đổi)</th>
                      <th className="p-4 font-bold text-center">Số lần vắng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {attendanceList.map((student, idx) => (
                      <tr key={student.student_id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="p-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="p-4 font-bold text-slate-200">{student.name}</td>
                        <td className="p-4 font-mono text-sm text-purple-400">{student.student_code}</td>
                        
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => handleToggleLocalAttendance(student.student_id, student.today_status)}
                            className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center mx-auto transition-all transform active:scale-90 ${
                              student.today_status === 'present' 
                                ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.3)]' 
                                : 'bg-slate-800 border-slate-600 hover:border-rose-500 hover:bg-rose-500/10'
                            }`}
                          >
                            {student.today_status === 'present' && '✓'}
                          </button>
                        </td>

                        <td className="p-4 text-center font-bold">
                          <span className={`inline-block min-w-[2rem] px-2 py-1 rounded text-xs ${
                            Number(student.total_absences) > 0 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'text-slate-500'
                          }`}>
                            {student.total_absences}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-700 bg-slate-800/50">
               <h2 className="text-xl font-bold text-white flex items-center gap-2"><span>📜</span> Lịch Sử Điểm Danh Theo Ngày</h2>
            </div>
            
            {attendanceHistory.length === 0 ? (
              <div className="text-center py-10 text-slate-500 font-bold">Chưa có bản ghi lịch sử nào.</div>
            ) : (
              <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide">
                {attendanceHistory.map((group) => (
                  <div key={group.date} className="border border-slate-700 rounded-2xl overflow-hidden bg-slate-900/30">
                    
                    {/* THẺ HEADER CỦA TỪNG NGÀY (Bấm để mở/đóng) */}
                    <button
                      onClick={() => setExpandedDate(expandedDate === group.date ? null : group.date)}
                      className="w-full p-5 hover:bg-slate-700/50 flex justify-between items-center transition-colors outline-none"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">📅</span>
                        <span className="text-lg font-bold text-sky-400">{group.date}</span>
                        <span className="text-xs px-3 py-1 bg-slate-800 text-slate-400 font-bold rounded-full border border-slate-600">
                          {group.records.length} học sinh
                        </span>
                      </div>
                      <span className={`text-slate-400 font-bold transition-transform duration-300 ${expandedDate === group.date ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>

                    {/* BẢNG CHI TIẾT CỦA NGÀY (Chỉ hiện khi thẻ được bấm mở) */}
                    {expandedDate === group.date && (
                      <div className="bg-slate-900 border-t border-slate-700 animate-fade-in-down p-4">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-700/50">
                              <th className="pb-3 font-bold w-16 text-center">STT</th>
                              <th className="pb-3 font-bold">Học sinh</th>
                              <th className="pb-3 font-bold">MSSV</th>
                              <th className="pb-3 font-bold text-center">Tình trạng</th>
                              <th className="pb-3 font-bold text-right">Giờ chốt sổ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {group.records.map((hist: any, i: number) => (
                              <tr key={hist.attendance_id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="py-3 text-center text-slate-600 font-medium">{i + 1}</td>
                                <td className="py-3 font-bold text-slate-300">{hist.name}</td>
                                <td className="py-3 text-sm font-mono text-purple-400">{hist.student_code}</td>
                                <td className="py-3 text-center">
                                  {hist.status === 'present' 
                                    ? <span className="px-3 py-1 text-xs font-bold bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">Có mặt</span>
                                    : <span className="px-3 py-1 text-xs font-bold bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">Vắng mặt</span>
                                  }
                                </td>
                                <td className="py-3 text-right text-xs font-mono text-slate-500">
                                  {new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(hist.recorded_at))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}