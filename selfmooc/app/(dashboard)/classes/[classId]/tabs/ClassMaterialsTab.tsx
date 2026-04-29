'use client';

import { useEffect, useRef, useState } from 'react';
import { getClassMaterialsAction } from '@/modules/classes/controller/class.action';
import { createClassDocAction, deleteClassDocAction } from '@/modules/classes/controller/document.action';

export default function ClassMaterialsTab({ classId }: { classId: number }) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);


  //modal upload material
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  //upload function
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  //delete function
  const handleDeleteDoc = async (docId: number) => {
    if (window.confirm('Xóa tài liệu này?')) {
      const res = await deleteClassDocAction(docId, classId);
      if (res.success) {
        setMaterials(prev => prev.filter(d => d.document_id !== docId));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement; // ✅ FIX cốt lõi
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      alert("⚠️ Thiếu file");
      return;
    }

    setIsUploading(true);

    try {
      // 1. upload file
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('type', 'class');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadForm,
      });

      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        throw new Error(uploadData.message);
      }

      const { fileUrl, cloudinaryId } = uploadData;

      // 2. build form an toàn (KHÔNG dùng from(form) nữa)
      const formData = new FormData();

      const title = (form.querySelector('input[name="title"]') as HTMLInputElement)?.value;
      const docType = (form.querySelector('select[name="doc_type"]') as HTMLSelectElement)?.value;

      if (!title) {
        throw new Error("Thiếu title");
      }

      formData.set('title', title);
      formData.set('doc_type', docType || 'lecture');
      formData.set('class_id', classId.toString());
      formData.set('file_url', fileUrl);
      formData.set('cloudinary_id', cloudinaryId);
      formData.set('file_ext', file.name.split('.').pop()?.toLowerCase() || 'unknown');
      formData.set('file_size_kb', String(Math.round(file.size / 1024)));

      const res = await createClassDocAction(formData);

      if (res.success) {
        setIsOpenModal(false);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        const reload = await getClassMaterialsAction(classId);
        if (reload.success) setMaterials(reload.data);
      } else {
        alert(res.message);
      }

    } catch (err: any) {
      alert("❌ Upload lỗi: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    async function loadMaterials() {
      setIsLoadingMaterials(true);
      const res = await getClassMaterialsAction(classId);
      if (res.success) setMaterials(res.data);
      setIsLoadingMaterials(false);
    }
    loadMaterials();
  }, [classId]);

  //Search
  const [search, setSearch] = useState('');
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([]);
  useEffect(() => {
    const filtered = materials.filter(doc =>
      (doc.title || '').toLowerCase().includes(search.toLowerCase())
    );
    setFilteredMaterials(filtered);
  }, [search, materials]);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><span>📚</span> Kho Học Liệu</h2>
        <button
          onClick={() => setIsOpenModal(true)}
          className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-[2px] active:shadow-none"
        >
          ➕ Tải thêm tài liệu Lớp
        </button>
      </div>
      <div className="mb-6 flex gap-3 items-center">
        <input
          type="text"
          placeholder="🔍 Tìm tài liệu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-5 py-3 border-2 border-gray-200 rounded-2xl w-full max-w-md focus:outline-none focus:border-emerald-400"
        />

        <button
          onClick={() => {
            const sorted = [...materials].sort((a, b) =>
              (a.title || '').localeCompare(b.title || '')
            );
            setFilteredMaterials(sorted);
          }}
          className="px-4 py-3 bg-gray-100 rounded-2xl font-bold hover:bg-gray-200"
        >
          🔤 A-Z
        </button>
      </div>

      {isLoadingMaterials ? (
        <div className="text-center py-20 text-emerald-500 animate-pulse font-bold">Đang tải kho học liệu...</div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-gray-200 border-dashed shadow-sm">
          <span className="text-6xl mb-4 block grayscale opacity-50">📂</span>
          <h3 className="text-xl font-bold text-gray-400 mb-2">Chưa có tài liệu nào</h3>
          <p className="text-gray-500 font-medium">Khóa học gốc chưa có tài liệu. Hãy sang mục Quản lý Khóa học để thêm nhé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMaterials.map((doc) => (
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
                {doc.file_url && doc.file_url !== '#' && (
                  <>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-100 text-sky-500 rounded-full flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all shadow-sm font-bold">
                      👁️
                    </a>
                    <a href={`${doc.file_url}?download=1`}
                      className="w-10 h-10 bg-gray-100 text-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm font-bold">
                      ⬇️
                    </a>
                  </>
                )}

                {/* ✅ CHỈ HIỆN NÚT XOÁ NẾU LÀ CLASS */}
                {!doc.course_id && (
                  <button
                    onClick={() => handleDeleteDoc(doc.document_id)}
                    className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm font-bold"
                    title="Xóa tài liệu"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}

        </div>
      )}
      {isOpenModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl animate-fade-in">

            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>☁️</span> Tải tài liệu lớp
            </h2>

            <form onSubmit={handleUpload} className="space-y-4">

              {/* FILE */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  File đính kèm *
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors 
            ${selectedFile ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4"
                  />

                  {selectedFile ? (
                    <div className="text-center px-4">
                      <span className="text-3xl block mb-1">📄</span>
                      <p className="text-sm font-bold text-emerald-600 truncate max-w-[200px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <span className="text-3xl block mb-1">📥</span>
                      <p className="text-sm font-bold">Bấm để chọn file</p>
                    </div>
                  )}
                </div>
              </div>

              {/* TITLE */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Tên tài liệu *
                </label>
                <input
                  name="title"
                  required
                  placeholder="VD: Slide chương 1"
                  className="w-full px-4 py-3 border-2 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>

              {/* TYPE */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Loại tài liệu
                </label>
                <select
                  name="doc_type"
                  className="w-full px-4 py-3 border-2 rounded-xl focus:border-emerald-500 outline-none bg-white"
                >
                  <option value="lecture">📖 Bài giảng</option>
                  <option value="exercise">✍️ Bài tập</option>
                  <option value="video">🎥 Video</option>
                </select>
              </div>

              {/* ACTION */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="flex-1 py-3 bg-gray-200 rounded-xl font-bold hover:bg-gray-300"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isUploading ? '⏳ ĐANG TẢI...' : 'LƯU TÀI LIỆU'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );

}