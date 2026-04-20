'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';

import ClassStudentsTab from './tabs/ClassStudentTab';
import ClassQuizzesTab from './tabs/ClassQuizzesTab';
import ClassMaterialsTab from './tabs/ClassMaterialsTab';
import ClassAttendanceTab from './tabs/ClassAttendanceTab';
import ClassScheduleTab from './tabs/ClassScheduleTab';
import ClassAnnouncementTab from './tabs/ClassAnnouncementTab';

export default function TeacherClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const resolvedParams = use(params);
  const classId = parseInt(resolvedParams.classId);
  const router = useRouter();

  // Chỉ giữ lại đúng 1 State quản lý việc chuyển Tab
  const [activeTab, setActiveTab] = useState<'announcements' | 'students' | 'quizzes' | 'materials' | 'attendance' | 'schedule'>('students');

  return (
    <div className="max-w-7xl mx-auto pb-10 px-4 lg:px-8">
      {/* NÚT QUAY LẠI */}


      {/* HEADER LỚP HỌC - LIGHT MODE */}
      <div className="bg-white rounded-[2rem] shadow-sm p-8 mb-8 border-2 border-sky-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-6 z-10">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-4xl border-2 border-blue-100 shadow-inner">🏫</div>
          <div>
            <p className="text-blue-500 font-black text-sm uppercase tracking-widest mb-1">ID Lớp: #{classId}</p>
            <h1 className="text-3xl font-extrabold text-gray-800">Quản Lý Lớp Học</h1>
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG TABS - LIGHT MODE */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 custom-scrollbar">
        <button onClick={() => setActiveTab('announcements')} className={`px-6 py-3 font-bold rounded-2xl transition-all whitespace-nowrap border-2 ${activeTab === 'announcements' ? 'bg-sky-500 text-white border-sky-500 shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-sky-200 hover:bg-sky-50'}`}>📢 Thông báo & Bài đăng</button>
        <button onClick={() => setActiveTab('students')} className={`px-6 py-3 font-bold rounded-2xl transition-all whitespace-nowrap border-2 ${activeTab === 'students' ? 'bg-purple-500 text-white border-purple-500 shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-purple-200 hover:bg-purple-50'}`}>👥 Danh sách Học sinh</button>
        <button onClick={() => setActiveTab('quizzes')} className={`px-6 py-3 font-bold rounded-2xl transition-all whitespace-nowrap border-2 ${activeTab === 'quizzes' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-amber-200 hover:bg-amber-50'}`}>📝 Bài tập & Quiz</button>
        <button onClick={() => setActiveTab('materials')} className={`px-6 py-3 font-bold rounded-2xl transition-all whitespace-nowrap border-2 ${activeTab === 'materials' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50'}`}>📚 Kho Học liệu</button>
        <button onClick={() => setActiveTab('attendance')} className={`px-6 py-3 font-bold rounded-2xl transition-all whitespace-nowrap border-2 ${activeTab === 'attendance' ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-rose-200 hover:bg-rose-50'}`}>✅ Điểm danh</button>
        <button onClick={() => setActiveTab('schedule')} className={`px-6 py-3 font-bold rounded-2xl transition-all whitespace-nowrap border-2 ${activeTab === 'schedule' ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200 hover:bg-indigo-50'}`}>📅 Lịch học</button>
      </div>

      {/* HIỂN THỊ NỘI DUNG DỰA VÀO TAB ĐANG CHỌN */}
      {activeTab === 'announcements' && <ClassAnnouncementTab classId={classId} />}
      {activeTab === 'students' && <ClassStudentsTab classId={classId} />}

      {activeTab === 'quizzes' && <ClassQuizzesTab classId={classId} />}
      {activeTab === 'materials' && <ClassMaterialsTab classId={classId} />}
      {activeTab === 'attendance' && <ClassAttendanceTab classId={classId} />}
      {activeTab === 'schedule' && <ClassScheduleTab classId={classId} />}

    </div>
  );
}