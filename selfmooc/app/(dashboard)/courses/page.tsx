'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  getMyCoursesAction,
  createCourseAction,
  updateCourseAction,
  deleteCourseAction,
  togglePublishAction
} from '@/modules/courses/controller/course.action';

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State quản lý Modal dùng chung cho cả Tạo & Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null); // Nếu null -> Đang Tạo mới. Nếu có data -> Đang Sửa

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  //Search
  const [search, setSearch] = useState('');
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  useEffect(() => {
    const filtered = courses.filter(course =>
      course.name.toLowerCase().includes(search.toLowerCase()) ||
      course.code.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredCourses(filtered);
  }, [search, courses]);

  const loadCourses = async () => {
    const res = await getMyCoursesAction();
    if (res.success) {
      setCourses(res.data);
      setFilteredCourses(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Mở popup để Tạo mới
  const openCreateModal = () => {
    setEditingCourse(null);
    setMessage('');
    setIsModalOpen(true);
  };

  // Mở popup để Sửa
  const openEditModal = (course: any) => {
    setEditingCourse(course);
    setMessage('');
    setIsModalOpen(true);
  };

  // Xử lý LƯU (Dùng chung cho cả Tạo và Sửa)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const formData = new FormData(e.currentTarget);

    // Nếu đang có editingCourse thì gọi hàm Sửa, ngược lại thì gọi hàm Tạo
    const result = editingCourse
      ? await updateCourseAction(formData)
      : await createCourseAction(formData);

    if (result.success) {
      setMessage(result.message);
      loadCourses();
      setTimeout(() => {
        setIsModalOpen(false);
        setMessage('');
      }, 1000);
    } else {
      setMessage('❌ ' + result.message);
    }
    setIsSubmitting(false);
  };

  // Xử lý Xóa (Có hỏi xác nhận trước khi xóa)
  const handleDelete = async (courseId: number, courseName: string) => {
    if (window.confirm(`⚠️ Bạn có chắc chắn muốn xóa môn "${courseName}" không? Mọi dữ liệu liên quan sẽ bị mất vĩnh viễn!`)) {
      const res = await deleteCourseAction(courseId);
      if (res.success) {
        setCourses(prev => prev.filter(c => c.course_id !== courseId)); // Xóa ngay trên giao diện cho mượt
      } else {
        alert(res.message);
      }
    }
  };

  const handleTogglePublish = async (courseId: number, currentStatus: boolean) => {
    setCourses(prev => prev.map(c => c.course_id === courseId ? { ...c, is_published: !currentStatus } : c));
    const res = await togglePublishAction(courseId, !currentStatus);
    if (!res.success) {
      alert(res.message);
      loadCourses();
    }
  };





  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
            <span className="text-4xl">📚</span> Quản lý Môn học
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Nơi bạn thiết kế các bộ khung chương trình chuẩn xác</p>
        </div>

        <button onClick={openCreateModal} className="px-6 py-3 bg-blue-500 text-white font-bold rounded-2xl hover:bg-blue-600 hover:-translate-y-1 transition-all shadow-[0_4px_0_rgb(37,99,235)] active:translate-y-[2px] active:shadow-none">
          ➕ Tạo Môn Mới
        </button>
      </div>

      <div className="mb-6 flex gap-3 items-center">
        <input
          type="text"
          placeholder="🔍 Tìm môn học..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-5 py-3 border-2 border-gray-200 rounded-2xl w-full max-w-md focus:outline-none focus:border-blue-400"
        />

        <button
          onClick={() => {
            const sorted = [...filteredCourses].sort((a, b) =>
              a.name.localeCompare(b.name)
            );
            setFilteredCourses(sorted);
          }}
          className="px-4 py-3 bg-gray-100 rounded-2xl font-bold hover:bg-gray-200"
        >
          🔤 A-Z
        </button>
      </div>

      {isLoading ? (
        <div className="text-center mt-20 text-xl font-bold text-gray-400 animate-pulse">⏳ Đang tải dữ liệu...</div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-300">
          <span className="text-6xl mb-4 block">📭</span>
          <h3 className="text-2xl font-bold text-gray-600">Chưa có môn học nào!</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.course_id} className="bg-white rounded-3xl overflow-hidden shadow-sm border-2 transition-all hover:shadow-xl hover:-translate-y-1 relative group" style={{ borderColor: course.theme_color || '#e5e7eb' }}>

              {/* NÚT XÓA (Chỉ hiện khi di chuột vào thẻ) */}
              <button
                onClick={() => handleDelete(course.course_id, course.name)}
                className="absolute top-3 left-3 w-8 h-8 bg-white/80 backdrop-blur-sm text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all z-10 shadow-sm"
                title="Xóa môn học"
              >
                🗑️
              </button>

              <div className="h-32 flex items-center justify-center relative" style={{ backgroundColor: course.theme_color ? `${course.theme_color}20` : '#f3f4f6' }}>
                <span className="text-6xl">{course.thumbnail_url || '📘'}</span>

                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                  <span className="text-xs font-bold text-gray-600">{course.is_published ? 'Đang mở' : 'Đang ẩn'}</span>
                  <button onClick={() => handleTogglePublish(course.course_id, course.is_published)} className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${course.is_published ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${course.is_published ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 line-clamp-1 mb-2">{course.name}</h3>
                <p className="text-xs font-mono font-bold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded-lg mb-3">MÃ: {course.code}</p>
                <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">{course.description || 'Chưa có mô tả.'}</p>

                <div className="flex gap-2">
                  <button onClick={() => openEditModal(course)} className="flex-1 py-2 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-200 border-2 border-gray-100 transition-colors">
                    ✏️ Sửa
                  </button>
                  <Link
                    href={`/courses/${course.course_id}`}
                    className="flex-1 flex items-center justify-center py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 border-2 border-blue-50 transition-colors"
                  >
                    📚 Chi tiết
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TẠO / SỬA MÔN HỌC */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all">
            <div className={`p-6 text-white flex justify-between items-center ${editingCourse ? 'bg-amber-500' : 'bg-blue-500'}`}>
              <h2 className="text-2xl font-bold">{editingCourse ? '✏️ Cập Nhật Môn Học' : '✨ Tạo Môn Mới'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:rotate-90 transition-transform text-2xl">✖</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* TRƯỜNG ẨN ĐỂ LƯU ID KHI SỬA */}
              {editingCourse && <input type="hidden" name="course_id" value={editingCourse.course_id} />}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên Môn Học *</label>
                <input name="name" defaultValue={editingCourse?.name} required placeholder="VD: Toán Tư Duy Lớp 3" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mã Môn Học *</label>
                <input name="code" defaultValue={editingCourse?.code} required placeholder="VD: TOAN03" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors font-mono uppercase" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Màu sắc chủ đạo</label>
                <div className="flex gap-3">
                  {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map(color => (
                    <label key={color} className="cursor-pointer flex-1">
                      <input type="radio" name="theme_color" value={color} className="peer sr-only" defaultChecked={editingCourse ? editingCourse.theme_color === color : color === '#3B82F6'} />
                      <div className="h-10 rounded-xl border-4 border-transparent peer-checked:border-gray-800 transition-all" style={{ backgroundColor: color }}></div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả ngắn</label>
                <textarea name="description" defaultValue={editingCourse?.description} rows={3} placeholder="Giới thiệu đôi nét..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors resize-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Icon đại diện (Emoji)</label>
                <input name="thumbnail_url" defaultValue={editingCourse?.thumbnail_url} placeholder="VD: 🐯, 🚀, 🍎" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors text-2xl" />
              </div>

              {message && (
                <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {message}
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className={`w-full py-4 mt-4 text-white text-lg font-bold rounded-xl transition-colors disabled:opacity-50 ${editingCourse ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                {isSubmitting ? '⏳ ĐANG LƯU...' : (editingCourse ? 'LƯU THAY ĐỔI' : 'TẠO MÔN HỌC')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}