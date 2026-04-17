'use client';

import { useEffect, useState } from 'react';
import { getClassMaterialsAction } from '@/modules/classes/controller/class.action';

export default function ClassMaterialsTab({ classId }: { classId: number }) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);

  useEffect(() => {
    async function loadMaterials() {
      setIsLoadingMaterials(true);
      const res = await getClassMaterialsAction(classId);
      if (res.success) setMaterials(res.data);
      setIsLoadingMaterials(false);
    }
    loadMaterials();
  }, [classId]);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><span>📚</span> Kho Học Liệu</h2>
        <button className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-[2px] active:shadow-none">
          ➕ Tải thêm tài liệu Lớp
        </button>
      </div>

      {isLoadingMaterials ? (
        <div className="text-center py-20 text-emerald-500 animate-pulse font-bold">Đang tải kho học liệu...</div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-gray-200 border-dashed shadow-sm">
          <span className="text-6xl mb-4 block grayscale opacity-50">📂</span>
          <h3 className="text-xl font-bold text-gray-400 mb-2">Chưa có tài liệu nào</h3>
          <p className="text-gray-500 font-medium">Khóa học gốc chưa có tài liệu. Hãy sang mục Quản lý Khóa học để thêm nhé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((doc) => (
            <div key={doc.document_id} className="bg-white p-5 rounded-2xl border-2 border-gray-100 flex items-center justify-between hover:border-emerald-300 shadow-sm transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl font-bold uppercase border border-emerald-100">
                  {doc.doc_type === 'video' ? '🎥' : (doc.file_ext || '📄')}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg line-clamp-1">{doc.title}</h4>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded font-bold border ${doc.course_id ? 'text-sky-600 bg-sky-50 border-sky-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200'}`}>
                      {doc.course_id ? '🌐 Của Khóa Học' : '📌 Của Lớp Này'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {doc.storage_url && doc.storage_url !== '#' && (
                  <>
                    <a href={doc.storage_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 text-sky-500 rounded-full flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all shadow-sm font-bold" title="Xem tài liệu">👁️</a>
                    <a href={`${doc.storage_url}?download=1`} className="w-10 h-10 bg-gray-100 text-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm font-bold" title="Tải xuống máy">⬇️</a>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}