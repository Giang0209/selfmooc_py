'use client';

import { useEffect, useState } from 'react';
import { linkChildAction } from '@/modules/family/controller/family.action';
// Import API lấy danh sách con + điểm số đã gom nhóm
import { getMyChildrenLearningAction } from '@/modules/courses/controller/course.action';

export default function FamilyPage() {
  const [childrenData, setChildrenData] = useState<any[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Tải dữ liệu toàn bộ gia đình (Bao gồm cả danh sách bé và lớp học)
  const loadFamilyData = async () => {
    setIsLoading(true);
    const res = await getMyChildrenLearningAction();
    if (res.success) {
      setChildrenData(res.data);
      // Tự động chọn bé đầu tiên làm Tab mặc định nếu có dữ liệu
      if (res.data.length > 0 && !activeStudentId) {
        setActiveStudentId(res.data[0].student_id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadFamilyData();
  }, []);

  // 2. Xử lý Form nhận con
  const handleLinkChild = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLinking(true);
    setMessage('');
    
    const formData = new FormData(e.currentTarget);
    const result = await linkChildAction(formData);
    
    setMessage(result.message);
    if (result.success) {
      (e.target as HTMLFormElement).reset();
      loadFamilyData(); // Tải lại cục dữ liệu mới
    }
    setIsLinking(false);
  };

  // Lấy dữ liệu của bé đang được chọn để render ở phần dưới
  const activeChild = childrenData.find(c => c.student_id === activeStudentId);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-5xl">🏡</span>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
          Gia Đình Của Tôi
        </h1>
      </div>

      {/* KHUNG TRÊN: THÊM BÉ VÀ CHỌN TAB BÉ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* CỘT TRÁI: FORM NHẬN CON */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm p-6 border-2 border-emerald-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>➕</span> Thêm thành viên
            </h2>
            
            <form onSubmit={handleLinkChild} className="space-y-4">
              <div>
                <input name="student_code" required placeholder="Mã học sinh (VD: HS123)" className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 transition-all font-mono uppercase text-sm" />
              </div>
              <div>
                <select name="relationship" required className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 transition-all bg-white text-sm cursor-pointer">
                  <option value="mother">👩 Mẹ</option>
                  <option value="father">👨 Bố</option>
                  <option value="guardian">🛡️ Giám hộ</option>
                </select>
              </div>

              {message && (
                <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.includes('thành công') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {message}
                </div>
              )}

              <button type="submit" disabled={isLinking} className="w-full py-3 text-white font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-[2px] active:shadow-none">
                {isLinking ? '⏳ TÌM BÉ...' : 'KẾT NỐI'}
              </button>
            </form>
          </div>
        </div>

        {/* CỘT PHẢI: DANH SÁCH CÁC CON (DẠNG TAB) */}
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
                <div 
                  key={child.student_id} 
                  onClick={() => setActiveStudentId(child.student_id)}
                  className={`min-w-[200px] cursor-pointer rounded-3xl p-4 transition-all transform hover:-translate-y-1 border-2 flex items-center gap-4 ${
                    isActive 
                      ? 'bg-emerald-50 border-emerald-400 shadow-md' 
                      : 'bg-white border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50'
                  }`}
                >
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

      {/* KHUNG DƯỚI: CHI TIẾT HỌC TẬP CỦA BÉ ĐANG ĐƯỢC CHỌN */}
      {activeChild && (
        <div className="bg-white rounded-3xl shadow-sm border-2 border-sky-100 p-8 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="flex items-center gap-3 mb-8">
            <span className="text-3xl">📊</span>
            <h2 className="text-2xl font-bold text-gray-800">
              Tiến độ của <span className="text-blue-600">{activeChild.student_name}</span>
            </h2>
          </div>

          {activeChild.courses.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-5xl opacity-50 block mb-4">💤</span>
              <p className="text-gray-500 font-medium text-lg">Bé chưa đăng ký học lớp nào cả.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeChild.courses.map((course: any, idx: number) => (
                <div key={idx} className="bg-gray-50 rounded-2xl p-5 border-2 border-gray-100 flex items-center gap-5 hover:border-blue-200 transition-colors group">
                  
                  {/* Icon môn học */}
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm transform group-hover:scale-110 transition-transform" style={{ backgroundColor: course.theme_color ? `${course.theme_color}20` : '#DBEAFE' }}>
                    {course.thumbnail_url || '📘'}
                  </div>

                  {/* Thông tin */}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{course.course_name}</h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">Lớp: {course.class_name}</p>
                    
                    {/* Thanh điểm số */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${(Number(course.overall_grade || 0) / 10) * 100}%`,
                            backgroundColor: Number(course.overall_grade) >= 8 ? '#10B981' : Number(course.overall_grade) >= 5 ? '#F59E0B' : '#EF4444'
                          }}
                        ></div>
                      </div>
                      <span className="font-extrabold text-gray-700 w-8 text-right">
                        {course.overall_grade ? Number(course.overall_grade).toFixed(1) : '-'}
                      </span>
                    </div>
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