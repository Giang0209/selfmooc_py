'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAnnouncementsAction } from '@/modules/announcements/controller/announcement.action';
import { getClassAssignmentsAction } from '@/modules/assignments/controller/assignment.action';
import { getClassMaterialsAction } from '@/modules/classes/controller/class.action';

export default function StudentClassDetailPage({ classId }: { classId: number }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'announcements' | 'assignments' | 'materials'>('announcements');
  
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      if (activeTab === 'announcements') {
        const res = await getAnnouncementsAction(classId);
        if (res.success) setAnnouncements(res.data);
      } else if (activeTab === 'assignments') {
        const res = await getClassAssignmentsAction(classId);
        if (res.success) setAssignments(res.data);
      } else if (activeTab === 'materials') {
        const res = await getClassMaterialsAction(classId);
        if (res.success) setMaterials(res.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [activeTab, classId]);

  const formatDate = (dateStr: string) => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr));

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <button onClick={() => router.back()} className="mb-6 font-bold text-gray-500 hover:text-sky-500 flex items-center gap-2 transition-colors">
        <span>⬅</span> Quay lại
      </button>

      {/* HEADER LỚP HỌC */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[3rem] shadow-xl p-10 mb-10 text-white flex items-center gap-6">
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-5xl shadow-inner backdrop-blur-sm">🏫</div>
        <div>
          <h1 className="text-4xl font-black mb-2">Không Gian Lớp Học</h1>
          <p className="font-medium text-blue-100">Cùng xem hôm nay Thầy/Cô có dặn dò gì không nhé!</p>
        </div>
      </div>

      {/* MENU TABS */}
      <div className="flex gap-4 mb-8 bg-white p-2 rounded-3xl shadow-sm border-2 border-gray-100 w-fit">
        <button onClick={() => setActiveTab('announcements')} className={`px-6 py-3 font-bold rounded-2xl transition-all ${activeTab === 'announcements' ? 'bg-sky-100 text-sky-600' : 'text-gray-500 hover:bg-gray-50'}`}>📢 Thông báo</button>
        <button onClick={() => setActiveTab('assignments')} className={`px-6 py-3 font-bold rounded-2xl transition-all ${activeTab === 'assignments' ? 'bg-amber-100 text-amber-600' : 'text-gray-500 hover:bg-gray-50'}`}>📝 Bài tập</button>
        <button onClick={() => setActiveTab('materials')} className={`px-6 py-3 font-bold rounded-2xl transition-all ${activeTab === 'materials' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-500 hover:bg-gray-50'}`}>📚 Học liệu</button>
      </div>

      {/* ======================= */}
      {/* TAB 1: THÔNG BÁO        */}
      {/* ======================= */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 animate-fade-in">
          {isLoading ? <div className="text-center font-bold text-gray-400 animate-pulse py-10">Đang tải thông báo...</div> 
          : announcements.length === 0 ? <div className="bg-white rounded-3xl p-12 text-center border-4 border-dashed border-gray-200"><span className="text-5xl block mb-4">📭</span><p className="font-bold text-gray-500">Chưa có thông báo nào từ Thầy/Cô.</p></div>
          : announcements.map((ann) => (
            <div key={ann._id} className="bg-white rounded-3xl p-8 border-4 border-sky-50 shadow-sm relative overflow-hidden">
              {ann.is_pinned && <div className="absolute top-0 right-0 bg-amber-100 text-amber-600 font-bold px-4 py-1 rounded-bl-2xl text-xs">⭐ QUAN TRỌNG</div>}
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{ann.title}</h3>
              <p className="text-sm font-bold text-gray-400 mb-4">🕒 {formatDate(ann.created_at)}</p>
              <div className="text-gray-600 bg-gray-50 p-5 rounded-2xl whitespace-pre-wrap font-medium">{ann.body}</div>
            </div>
          ))}
        </div>
      )}

      {/* ======================= */}
      {/* TAB 2: BÀI TẬP          */}
      {/* ======================= */}
      {activeTab === 'assignments' && (
        <div className="animate-fade-in">
          {isLoading ? <div className="text-center font-bold text-gray-400 animate-pulse py-10">Đang tìm bài tập...</div> 
          : assignments.length === 0 ? <div className="bg-white rounded-3xl p-12 text-center border-4 border-dashed border-gray-200"><span className="text-5xl block mb-4">🎉</span><p className="font-bold text-gray-500">Tuyệt vời! Hiện tại không có bài tập nào.</p></div>
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignments.map((ass) => (
                <div key={ass.assignment_id} className="bg-white rounded-3xl p-6 border-4 border-amber-50 shadow-sm hover:border-amber-200 transition-colors">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center text-2xl font-bold">📝</div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-xl">{ass.title}</h3>
                      <p className="text-xs font-bold text-amber-500 uppercase">{ass.assignment_type}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl text-sm font-bold text-gray-500 space-y-2 mb-6">
                    <p>⏳ Thời gian: {ass.time_limit_min ? <span className="text-blue-500">{ass.time_limit_min} phút</span> : 'Không giới hạn'}</p>
                    <p>📅 Hạn chót: {ass.due_date ? <span className="text-rose-500">{new Date(ass.due_date).toLocaleDateString('vi-VN')}</span> : 'Không có'}</p>
                  </div>
                  <button 
                    onClick={() => router.push(`/assignments/${ass.assignment_id}`)}
                    className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black rounded-xl hover:shadow-lg transition-all active:scale-95"
                  >
                    LÀM BÀI NGAY
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================= */}
      {/* TAB 3: HỌC LIỆU         */}
      {/* ======================= */}
      {activeTab === 'materials' && (
        <div className="animate-fade-in">
          {isLoading ? <div className="text-center font-bold text-gray-400 animate-pulse py-10">Đang lục tìm sách vở...</div> 
          : materials.length === 0 ? <div className="bg-white rounded-3xl p-12 text-center border-4 border-dashed border-gray-200"><span className="text-5xl block mb-4">📂</span><p className="font-bold text-gray-500">Chưa có tài liệu nào được đăng.</p></div>
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {materials.map((doc) => (
                <div key={doc.document_id} className="bg-white rounded-3xl p-6 border-4 border-emerald-50 shadow-sm hover:border-emerald-200 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center text-2xl font-black uppercase">
                      {doc.doc_type === 'video' ? '🎥' : (doc.file_ext || '📄')}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg line-clamp-1">{doc.title}</h4>
                      <p className="text-xs font-bold text-gray-400 mt-1">Đăng ngày {formatDate(doc.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {doc.storage_url && doc.storage_url !== '#' && (
                      <>
                        <a href={doc.storage_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center hover:bg-sky-500 hover:text-white transition-colors">👁️</a>
                        <a href={`${doc.storage_url}?download=1`} className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors">⬇️</a>
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