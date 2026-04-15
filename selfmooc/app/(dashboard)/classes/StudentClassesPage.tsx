'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getMyLearningAction } from '@/modules/courses/controller/course.action'; 

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadClasses() {
      const res = await getMyLearningAction();
      if (res.success) setClasses(res.data);
      setIsLoading(false);
    }
    loadClasses();
  }, []);

  if (isLoading) {
    return <div className="text-center mt-20 text-xl font-bold text-sky-500 animate-pulse">⏳ Đang tải lớp học của bạn...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-10">
        <span className="text-5xl drop-shadow-md">🎒</span>
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Lớp Học Của Tớ</h1>
          <p className="text-gray-500 font-bold mt-1">Sẵn sàng khám phá những kiến thức mới chưa nào?</p>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-20 text-center border-4 border-dashed border-gray-200 shadow-inner">
          <span className="text-8xl mb-6 block">🏝️</span>
          <h3 className="text-2xl font-black text-gray-400">Bạn chưa tham gia lớp nào!</h3>
          <p className="text-gray-400 mt-2 font-bold">Hãy đợi Thầy/Cô thêm bạn vào lớp nhé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.map((cls) => (
            <div key={cls.class_id} className="group bg-white rounded-[3rem] p-8 shadow-xl border-4 border-sky-100 hover:border-blue-400 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-sky-400 text-white px-6 py-2 rounded-bl-[2rem] font-black text-xs shadow-md">
                {cls.academic_year}
              </div>

              <div className="mb-8 mt-4">
                <div className="flex items-center gap-2 text-blue-500 font-black text-xs uppercase tracking-widest mb-3">
                  <span className="text-2xl">{cls.thumbnail_url || '📘'}</span>
                  {cls.course_name}
                </div>
                <h2 className="text-2xl font-black text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">
                  {cls.class_name}
                </h2>
              </div>

              <div className="flex flex-wrap gap-3 mb-8">
                <div className="bg-sky-50 text-sky-600 px-4 py-2 rounded-xl text-sm font-bold border-2 border-sky-100">
                  Trạng thái: <span className="uppercase">{cls.enrollment_status}</span>
                </div>
                {cls.overall_grade && (
                  <div className="bg-green-50 text-green-600 px-4 py-2 rounded-xl text-sm font-bold border-2 border-green-100">
                    Điểm: {cls.overall_grade}
                  </div>
                )}
              </div>

              <Link href={`/classes/${cls.class_id}`}>
                <button className="w-full py-4 bg-gradient-to-r from-sky-400 to-blue-500 text-white font-black rounded-2xl group-hover:shadow-[0_6px_0_rgb(29,78,216)] transition-all flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none">
                  <span className="text-xl">🚀</span> VÀO LỚP NGAY
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}