'use client';

import { useEffect, useState } from 'react';
import { getClassStudentsAction, removeStudentAction } from '@/modules/classes/controller/class.action';
import { addStudentsToClassAction } from '@/modules/classes/controller/enrollment.action';

export default function ClassStudentsTab({ classId }: { classId: number }) {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedExcel, setSelectedExcel] = useState<File | null>(null);

  // Tự động tải danh sách khi mở Tab
  const loadStudents = async () => {
    setIsLoading(true);
    const res = await getClassStudentsAction(classId);
    if (res.success) setStudents(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, [classId]);

  // Xử lý xóa học sinh
  const handleRemoveStudent = async (studentId: number, studentName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa học sinh ${studentName} khỏi lớp không?`)) {
      const res = await removeStudentAction(classId, studentId);
      if (res.success) {
        setStudents(prev => prev.filter(s => s.student_id !== studentId)); 
      } else {
        alert(res.message);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* CỘT TRÁI: FORM THÊM HỌC SINH */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* KHỐI 1: NHẬP THỦ CÔNG */}
        <div className="bg-white rounded-3xl p-6 border-2 border-sky-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><span>⌨️</span> Nhập mã thủ công</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsAdding(true);
            const fd = new FormData(e.currentTarget);
            const res = await addStudentsToClassAction(classId, 'manual', { student_code: fd.get('student_code') });
            setMessage(res.message);
            if (res.success) loadStudents();
            setIsAdding(false);
          }} className="space-y-4">
            <input name="student_code" required placeholder="Nhập MSSV..." className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-bold font-mono uppercase focus:border-sky-500 outline-none transition-colors" />
            <button type="submit" disabled={isAdding} className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-all disabled:opacity-50">THÊM NHANH</button>
          </form>
        </div>

        {/* KHỐI 2: IMPORT EXCEL */}
        <div className="bg-white rounded-3xl p-6 border-2 border-purple-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2"><span>📊</span> Import Excel</h2>
          <p className="text-[10px] text-gray-400 mb-4 uppercase font-black">File cần có cột: MSSV, HoTen</p>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsAdding(true);
            const fd = new FormData(e.currentTarget);
            const res = await addStudentsToClassAction(classId, 'excel', fd.get('file'));
            setMessage(res.message);
            if (res.success) {
              loadStudents();
              setSelectedExcel(null); 
              (e.target as HTMLFormElement).reset(); 
            }
            setIsAdding(false);
          }} className="space-y-4">
            
            <div className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all bg-gray-50 ${selectedExcel ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-purple-400'}`}>
              <input 
                type="file" name="file" accept=".xlsx, .xls" required 
                className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setSelectedExcel(e.target.files && e.target.files.length > 0 ? e.target.files[0] : null)}
              />
              {selectedExcel ? (
                <div className="flex flex-col items-center justify-center animate-fade-in">
                  <span className="text-4xl mb-2 drop-shadow-md">📗</span>
                  <p className="text-sm font-bold text-emerald-600 line-clamp-1 px-2">{selectedExcel.name}</p>
                  <p className="text-xs text-emerald-500/70 mt-1 font-bold">{(selectedExcel.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-3xl mb-2 grayscale opacity-50">📁</span>
                  <p className="text-xs text-gray-500 font-bold">Bấm để chọn file .xlsx</p>
                </div>
              )}
            </div>

            {message && <div className="text-sm font-bold text-center text-sky-600 bg-sky-50 py-2 rounded-lg">{message}</div>}

            <button type="submit" disabled={isAdding || !selectedExcel} className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 shadow-[0_4px_0_rgb(126,34,206)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none">
              TẢI LÊN DANH SÁCH
            </button>
          </form>
        </div>
      </div>

      {/* CỘT PHẢI: HIỂN THỊ DANH SÁCH */}
      <div className="lg:col-span-2">
        {isLoading ? (
          <div className="text-center py-20 text-sky-500 animate-pulse font-bold">Đang tải danh sách lớp...</div>
        ) : students.length === 0 ? (
          <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-gray-200 border-dashed">
            <span className="text-5xl block mb-4 grayscale opacity-50">👻</span>
            <p className="text-gray-500 font-bold">Lớp học này chưa có học sinh nào.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b-2 border-gray-100 flex justify-between">
              <span className="text-gray-500 font-bold text-sm">Sĩ số hiện tại: <span className="text-sky-500 text-lg">{students.length}</span></span>
            </div>
            <div className="p-4 space-y-3">
              {students.map((student) => (
                <div key={student.student_id} className="bg-white rounded-2xl p-4 border-2 border-gray-100 flex items-center justify-between hover:border-sky-300 hover:bg-sky-50/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center text-xl border-2 border-white shadow-sm">
                      {student.avatar_url ? <img src={student.avatar_url} alt="avt" className="w-full h-full object-cover" /> : '🐶'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{student.name}</h3>
                      <p className="text-xs font-mono font-bold text-sky-600 bg-sky-100 px-2 py-0.5 rounded mt-1 inline-block border border-sky-200">{student.student_code}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveStudent(student.student_id, student.name)} className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-rose-100 hover:text-rose-500 transition-colors font-bold" title="Xóa khỏi lớp">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}