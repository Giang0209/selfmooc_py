'use client';

import { useEffect, useState } from 'react';
import { linkChildAction } from '@/modules/family/controller/family.action';
// 🎯 Import thêm hàm lấy chi tiết điểm vừa tạo ở backend
import { getMyChildrenLearningAction, getStudentClassGradesAction } from '@/modules/courses/controller/course.action';

export default function FamilyPage() {
  const [childrenData, setChildrenData] = useState<any[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [message, setMessage] = useState('');

  // 🎯 State quản lý Modal Bảng Điểm
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseGrades, setCourseGrades] = useState<any[]>([]);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);

  const loadFamilyData = async () => {
    setIsLoading(true);
    const res = await getMyChildrenLearningAction();
    if (res.success) {
      setChildrenData(res.data);
      if (res.data.length > 0 && !activeStudentId) {
        setActiveStudentId(res.data[0].student_id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadFamilyData();
  }, []);

  const handleLinkChild = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLinking(true);
    setMessage('');
    
    const formData = new FormData(e.currentTarget);
    const result = await linkChildAction(formData);
    
    setMessage(result.message);
    if (result.success) {
      (e.target as HTMLFormElement).reset();
      loadFamilyData(); 
    }
    setIsLinking(false);
  };

  // 🎯 Hàm mở Modal và fetch điểm
  const handleViewGrades = async (course: any, studentId: number) => {
    setSelectedCourse(course);
    setIsLoadingGrades(true);
    const res = await getStudentClassGradesAction(studentId, course.class_id);
    if (res.success) {
      setCourseGrades(res.data);
    }
    setIsLoadingGrades(false);
  };

  // 🎯 Hàm tính điểm trung bình theo loại bài tập
  const getAverage = (types: string[]) => {
    const validGrades = courseGrades.filter(g => types.includes(g.assignment_type) && g.grade !== null);
    if (validGrades.length === 0) return '-';
    const sum = validGrades.reduce((acc, curr) => acc + Number(curr.grade), 0);
    return (sum / validGrades.length).toFixed(1);
  };

  const activeChild = childrenData.find(c => c.student_id === activeStudentId);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-5xl">🏡</span>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
          Gia Đình Của Tôi
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* CỘT TRÁI: FORM NHẬN CON */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm p-6 border-2 border-emerald-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><span>➕</span> Thêm thành viên</h2>
            <form onSubmit={handleLinkChild} className="space-y-4">
              <input name="student_code" required placeholder="Mã học sinh (VD: HS123)" className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 font-mono uppercase text-sm" />
              <select name="relationship" required className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 bg-white text-sm">
                <option value="mother">👩 Mẹ</option>
                <option value="father">👨 Bố</option>
                <option value="guardian">🛡️ Giám hộ</option>
              </select>
              {message && <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.includes('thành công') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{message}</div>}
              <button type="submit" disabled={isLinking} className="w-full py-3 text-white font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-[2px] active:shadow-none">
                {isLinking ? '⏳ TÌM BÉ...' : 'KẾT NỐI'}
              </button>
            </form>
          </div>
        </div>

        {/* CỘT PHẢI: DANH SÁCH BÉ (TAB) */}
        <div className="lg:col-span-2 flex gap-4 overflow-x-auto pb-2 custom-scrollbar items-center">
          {isLoading ? (
            <div className="text-gray-400 font-bold animate-pulse">⏳ Đang tải dữ liệu gia đình...</div>
          ) : childrenData.length === 0 ? (
            <div className="bg-gray-50 rounded-3xl p-8 w-full text-center border-2 border-dashed border-gray-300">
              <span className="text-4xl mb-2 block">👶</span>
              <p className="text-gray-500 font-medium">Nhà mình chưa có bé nào! Nhập mã để kết nối nhé.</p>
            </div>
          ) : (
            childrenData.map((child) => {
              const isActive = activeStudentId === child.student_id;
              return (
                <div key={child.student_id} onClick={() => setActiveStudentId(child.student_id)} className={`min-w-[200px] cursor-pointer rounded-3xl p-4 transition-all transform hover:-translate-y-1 border-2 flex items-center gap-4 ${isActive ? 'bg-emerald-50 border-emerald-400 shadow-md' : 'bg-white border-gray-100 hover:border-emerald-200'}`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-inner border-4 ${isActive ? 'border-emerald-200 bg-white' : 'border-gray-50 bg-gray-100'}`}>
                    {child.student_avatar ? <img src={child.student_avatar} className="w-full h-full object-cover rounded-full" alt="avatar" /> : '🐶'}
                  </div>
                  <div>
                    <h3 className={`font-bold ${isActive ? 'text-emerald-700' : 'text-gray-700'}`}>{child.student_name}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">{child.courses.length} Khóa học</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CHI TIẾT HỌC TẬP CỦA BÉ */}
      {activeChild && (
        <div className="bg-white rounded-3xl shadow-sm border-2 border-sky-100 p-8 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-3 mb-8">
            <span className="text-3xl">📊</span>
            <h2 className="text-2xl font-bold text-gray-800">Tiến độ của <span className="text-blue-600">{activeChild.student_name}</span></h2>
          </div>

          {activeChild.courses.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-5xl opacity-50 block mb-4">💤</span>
              <p className="text-gray-500 font-medium text-lg">Bé chưa đăng ký học lớp nào cả.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeChild.courses.map((course: any, idx: number) => (
                <div 
                  key={idx} 
                  onClick={() => handleViewGrades(course, activeChild.student_id)} // 🎯 Gọi hàm mở Modal
                  className="bg-gray-50 cursor-pointer rounded-2xl p-5 border-2 border-gray-100 flex items-center gap-5 hover:border-blue-300 hover:bg-blue-50 transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm transform group-hover:scale-110 transition-transform bg-blue-100">
                    {course.thumbnail_url || '📘'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-blue-600 transition-colors">{course.course_name}</h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">Lớp: {course.class_name}</p>
                    <div className="mt-2 text-xs font-bold text-blue-500 bg-blue-500/10 w-fit px-2 py-1 rounded">Bấm để xem bảng điểm ➡️</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================= */}
      {/* 🚀 MODAL BẢNG ĐIỂM CHI TIẾT */}
      {/* ======================================================= */}
      {selectedCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedCourse(null)}></div>
          
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fade-in-up">
            
            {/* Header Modal */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-sky-50 rounded-t-[2rem]">
              <div>
                <p className="text-xs font-bold text-sky-500 uppercase tracking-widest mb-1">BẢNG ĐIỂM CHI TIẾT</p>
                <h3 className="text-2xl font-black text-gray-800">{selectedCourse.course_name}</h3>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:bg-rose-50 hover:text-rose-500 transition-colors shadow-sm">✖</button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {isLoadingGrades ? (
                <div className="py-20 text-center font-bold text-sky-500 animate-pulse">⏳ Đang lấy dữ liệu từ trường học...</div>
              ) : (
                <>
                  {/* THỐNG KÊ TRUNG BÌNH */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center">
                      <p className="text-xs font-bold text-emerald-600 uppercase mb-1">TB Bài tập VN</p>
                      <p className="text-3xl font-black text-emerald-500">{getAverage(['homework', 'practice'])}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-center">
                      <p className="text-xs font-bold text-amber-600 uppercase mb-1">TB Quiz (15p)</p>
                      <p className="text-3xl font-black text-amber-500">{getAverage(['quiz'])}</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-center">
                      <p className="text-xs font-bold text-rose-600 uppercase mb-1">Giữa / Cuối Kỳ</p>
                      <p className="text-3xl font-black text-rose-500">{getAverage(['midterm', 'final'])}</p>
                    </div>
                  </div>

                  {/* DANH SÁCH ĐIỂM CHI TIẾT */}
                  <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Lịch sử làm bài</h4>
                  {courseGrades.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 font-medium">Bé chưa có bài tập nào trong môn này.</div>
                  ) : (
                    <div className="space-y-3">
                      {courseGrades.map((grade, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-300 transition-colors">
                          <div>
                            <p className="font-bold text-gray-800">{grade.title}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-600 uppercase">{grade.assignment_type}</span>
                              {!grade.grade && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-600">Chưa chấm/Chưa nộp</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-2xl font-black ${grade.grade ? (Number(grade.grade) >= 8 ? 'text-emerald-500' : Number(grade.grade) >= 5 ? 'text-amber-500' : 'text-rose-500') : 'text-gray-300'}`}>
                              {grade.grade ? Number(grade.grade).toFixed(2) : '-'}
                            </span>
                            {grade.grade && <span className="text-sm font-bold text-gray-400">/10</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}