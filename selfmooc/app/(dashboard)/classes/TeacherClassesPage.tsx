'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getMyClassesListAction, createNewClassAction } from '@/modules/classes/controller/class.action';
import { getMyCoursesAction } from '@/modules/courses/controller/course.action';
import ClassScheduleBadge from '@/app/components/ClassScheduleBadge';

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    // Gọi song song để lấy cả Lớp học và Khóa học (cho dropdown)
    const [clsRes, crsRes] = await Promise.all([
      getMyClassesListAction(),
      getMyCoursesAction()
    ]);
    if (clsRes.success) setClasses(clsRes.data);
    if (crsRes.success) setAvailableCourses(crsRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    
    const formData = new FormData(e.currentTarget);
    const result = await createNewClassAction(formData);
    
    if (result.success) {
      setMessage(result.message);
      loadData();
      setTimeout(() => {
        setIsModalOpen(false);
        setMessage('');
      }, 1000);
    } else {
      setMessage('❌ ' + result.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
            <span className="text-4xl">🏫</span> Quản lý Lớp học
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Chọn lớp để quản lý học sinh, bài tập và gửi thông báo</p>
        </div>
        
        <button onClick={() => { setIsModalOpen(true); setMessage(''); }} className="px-6 py-3 bg-blue-500 text-white font-bold rounded-2xl hover:bg-blue-600 hover:-translate-y-1 transition-all shadow-[0_4px_0_rgb(37,99,235)] active:translate-y-[2px] active:shadow-none">
          ➕ Mở Lớp Mới
        </button>
      </div>

      {isLoading ? (
        <div className="text-center mt-20 text-xl font-bold text-gray-400 animate-pulse">⏳ Đang tải dữ liệu...</div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-300">
          <span className="text-6xl mb-4 block">🏝️</span>
          <h3 className="text-2xl font-bold text-gray-600">Thầy cô chưa mở lớp nào!</h3>
          <p className="text-gray-400 mt-2 font-medium">Hãy tạo Khóa học trước, sau đó Mở lớp nhé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.class_id} className="bg-white rounded-3xl overflow-hidden shadow-sm border-2 transition-all hover:shadow-xl hover:-translate-y-1 relative group" style={{ borderColor: cls.theme_color || '#e5e7eb' }}>
              <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 rounded-bl-2xl font-bold text-xs shadow-sm z-10">
                Kỳ {cls.semester} | {cls.academic_year}
              </div>

              <div className="p-6 pt-10">
                {/* KHỐI 1: ICON VÀ TÊN LỚP */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{cls.thumbnail_url || '📘'}</span>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider">{cls.course_name}</p>
                    <h3 className="text-xl font-bold text-gray-800 line-clamp-1">{cls.name}</h3>
                  </div>
                </div>
                
                <div className="mb-4">
                  <ClassScheduleBadge classId={cls.class_id} />
                </div>

                {/* KHỐI 3: ID VÀ SỐ HỌC SINH */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <div className="bg-sky-50 text-sky-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-sky-100 flex items-center">
                    🆔 ID: {cls.class_id}
                  </div>
                  <div className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-100 flex items-center">
                    👥 {cls.student_count}/{cls.max_students} Học sinh
                  </div>
                </div>
                
                <Link href={`/classes/${cls.class_id}`} className="block w-full text-center py-3 bg-sky-50 text-sky-600 font-bold rounded-xl hover:bg-blue-500 hover:text-white hover:shadow-[0_4px_0_rgb(37,99,235)] transition-all">
                  🚀 VÀO LỚP HỌC
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TẠO LỚP HỌC */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all">
            <div className="p-6 bg-blue-500 text-white flex justify-between items-center">
              <h2 className="text-2xl font-bold">✨ Mở Lớp Học Mới</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:rotate-90 transition-transform text-2xl">✖</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Kế thừa từ Khóa học gốc *</label>
                <select name="course_id" required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors bg-gray-50 font-bold text-gray-700">
                  <option value="">-- Chọn Khóa Học --</option>
                  {availableCourses.map(c => (
                    <option key={c.course_id} value={c.course_id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên Lớp (Mã Lớp) *</label>
                <input name="name" required placeholder="VD: Lớp 10A1 - Học Kỳ 1" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Năm học</label>
                  <input name="academic_year" defaultValue="2025-2026" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Học kỳ</label>
                  <select name="semester" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-white">
                    <option value="1">Học kỳ 1</option>
                    <option value="2">Học kỳ 2</option>
                    <option value="3">Học kỳ Hè</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Sĩ số tối đa</label>
                <input type="number" name="max_students" defaultValue={50} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none" />
              </div>

              {message && (
                <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.includes('✅') || message.includes('thành công') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {message}
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-4 bg-blue-500 text-white text-lg font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50">
                {isSubmitting ? '⏳ ĐANG LƯU...' : 'MỞ LỚP NGAY'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}