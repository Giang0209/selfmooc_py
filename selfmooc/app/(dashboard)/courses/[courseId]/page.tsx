'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
// Import Actions của Documents
import { getCourseDocsAction, createCourseDocAction, deleteCourseDocAction } from '@/modules/courses/controller/document.action';
// 🎯 Import Actions của Questions (Bạn nhớ kiểm tra lại đường dẫn nếu cần)
import { getCourseQuestionsAction, createQuestionAction, deleteQuestionAction } from '@/modules/courses/controller/question.action';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.courseId);

  const [activeTab, setActiveTab] = useState<'documents' | 'questions'>('documents');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // ==========================================
  // 1. STATE CHO TÀI LIỆU
  // ==========================================
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // 2. STATE CHO NGÂN HÀNG CÂU HỎI
  // ==========================================
  const [questions, setQuestions] = useState<any[]>([]);
  const [qType, setQType] = useState('multiple_choice');
  const [qText, setQText] = useState('');
  const [qChapter, setQChapter] = useState('1'); // Mặc định là số 1
  const [qDifficulty, setQDifficulty] = useState(2);
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const qImageInputRef = useRef<HTMLInputElement>(null);
  // State linh hoạt cho Trắc nghiệm (Mặc định 4 đáp án)
  const [mcOptions, setMcOptions] = useState([
    { label: 'A', text: '', is_correct: true },
    { label: 'B', text: '', is_correct: false },
    { label: 'C', text: '', is_correct: false },
    { label: 'D', text: '', is_correct: false },
  ]);

  // State linh hoạt cho Đúng/Sai
  const [tfAnswer, setTfAnswer] = useState(true);

  // ==========================================
  // 3. HÀM LOAD DỮ LIỆU TỔNG HỢP
  // ==========================================
  const loadAllData = async () => {
    setIsLoading(true);
    // Gọi song song 2 API cho nhanh
    const [docsRes, questsRes] = await Promise.all([
      getCourseDocsAction(courseId),
      getCourseQuestionsAction(courseId)
    ]);

    if (docsRes.success) setDocuments(docsRes.data);
    if (questsRes.success) setQuestions(questsRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [courseId]);

  // ==========================================
  // 4. XỬ LÝ NGHIỆP VỤ TÀI LIỆU (Giữ nguyên)
  // ==========================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
  };

  const handleUploadDoc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedFile) return alert("⚠️ Vui lòng chọn file!");
    setIsUploading(true);

    try {
      const form = e.target as HTMLFormElement;

      // ======================
      // 1. UPLOAD FILE TRƯỚC
      // ======================
      const uploadForm = new FormData();
      uploadForm.append('file', selectedFile);
      uploadForm.append('type', 'course');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadForm
      });

      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        throw new Error(uploadData.message);
      }

      const { fileUrl, cloudinaryId } = uploadData;

      // ======================
      // 2. BUILD FORM DATA CLEAN
      // ======================
      const formData = new FormData();

      const title = (form.querySelector('input[name="title"]') as HTMLInputElement)?.value;
      const docType = (form.querySelector('select[name="doc_type"]') as HTMLSelectElement)?.value;

      if (!title) throw new Error("Thiếu title");

      formData.set('title', title);
      formData.set('doc_type', docType || 'lecture');
      formData.set('course_id', courseId.toString());

      formData.set('file_url', fileUrl);
      formData.set('cloudinary_id', cloudinaryId);

      formData.set('file_ext', selectedFile.name.split('.').pop()?.toLowerCase() || 'unknown');
      formData.set('file_size_kb', String(Math.round(selectedFile.size / 1024)));

      // ======================
      // 3. CALL ACTION
      // ======================
      const result = await createCourseDocAction(formData);

      if (result.success) {
        form.reset();
        setSelectedFile(null);

        await loadAllData(); // reload lại docs
      } else {
        alert(result.message);
      }

    } catch (err: any) {
      alert("❌ Upload lỗi: " + err.message);
    }

    setIsUploading(false);
  };

  const handleDeleteDoc = async (docId: number) => {
    if (window.confirm('Xóa tài liệu này?')) {
      const res = await deleteCourseDocAction(docId, courseId);
      if (res.success) setDocuments(prev => prev.filter(d => d.document_id !== docId));
    }
  };

  // ==========================================
  // 5. XỬ LÝ NGHIỆP VỤ CÂU HỎI (MỚI 🎯)
  // ==========================================
  const handleUpdateOption = (index: number, text: string) => {
    const newOpts = [...mcOptions];
    newOpts[index].text = text;
    setMcOptions(newOpts);
  };

  // Cho phép CHỌN NHIỀU đáp án đúng (Toggle)
  const handleToggleCorrectOption = (index: number) => {
    const newOpts = [...mcOptions];
    newOpts[index].is_correct = !newOpts[index].is_correct;
    setMcOptions(newOpts);
  };

  // Thêm một đáp án mới (Tự động tính chữ cái E, F, G...)
  const handleAddOption = () => {
    const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextLabel = labels[mcOptions.length] || '?';
    setMcOptions([...mcOptions, { label: nextLabel, text: '', is_correct: false }]);
  };

  // Xóa bớt đáp án (Giữ lại tối thiểu 2 đáp án, tự động đánh lại chữ cái A B C)
  const handleRemoveOption = (index: number) => {
    if (mcOptions.length <= 2) return alert("⚠️ Trắc nghiệm phải có ít nhất 2 đáp án!");
    const newOpts = mcOptions.filter((_, i) => i !== index).map((opt, i) => ({
      ...opt,
      label: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i] || '?'
    }));
    setMcOptions(newOpts);
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return alert("⚠️ Vui lòng nhập nội dung đề bài!");

    // 🎯 THÊM ĐOẠN CHECK NÀY: Phải có ít nhất 1 đáp án đúng mới cho lưu
    if (qType === 'multiple_choice' && !mcOptions.some(opt => opt.is_correct)) {
      return alert("⚠️ Bạn chưa chọn đáp án đúng nào cho câu hỏi trắc nghiệm!");
    }

    setIsUploading(true);

    // Gói dữ liệu siêu to khổng lồ vào 1 cục JSON
    const payload = {
      question_type: qType,
      text: qText,
      chapter: qChapter,
      difficulty: qDifficulty,
      options: qType === 'multiple_choice' ? mcOptions : [],
      correct_answer: qType === 'true_false' ? tfAnswer : null,
      sample_answer: qType === 'essay' ? 'Giáo viên tự chấm' : null
    };

    const formData = new FormData();
    formData.append('course_id', courseId.toString());
    formData.append('payload', JSON.stringify(payload)); // 🎯 Đóng gói gửi đi

    if (questionImage) {
      formData.append('image', questionImage);
    }

    const res = await createQuestionAction(formData);
    if (res.success) {
      setQText(''); // Reset mỗi text để nhập tiếp cho nhanh
      setMcOptions([
        { label: 'A', text: '', is_correct: true },
        { label: 'B', text: '', is_correct: false },
        { label: 'C', text: '', is_correct: false },
        { label: 'D', text: '', is_correct: false },
      ]);
      setQuestionImage(null);
      setImagePreviewUrl(null);
      loadAllData();
    } else {
      alert(res.message);
    }
    setIsUploading(false);
  };

  const handleDeleteQuestion = async (qId: number) => {
    if (window.confirm('Xóa câu hỏi này khỏi ngân hàng?')) {
      const res = await deleteQuestionAction(qId, courseId);
      if (res.success) setQuestions(prev => prev.filter(q => q.question_id !== qId));
    }
  };


  return (
    <div className="max-w-6xl mx-auto pb-10">


      <div className="bg-white rounded-3xl shadow-sm p-8 mb-8 border-2 border-sky-100 flex gap-6 items-center">
        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
          📘
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">Cấu hình Môn học</h1>
          <p className="text-gray-500 font-medium">Quản lý Tài liệu và Ngân hàng câu hỏi cho môn học này</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 border-b-2 border-gray-100 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-6 py-3 font-bold rounded-2xl transition-all ${activeTab === 'documents' ? 'bg-blue-500 text-white shadow-[0_4px_0_rgb(37,99,235)]' : 'bg-gray-50 text-gray-600 hover:bg-blue-50'}`}
        >
          📄 Kho Tài Liệu
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-6 py-3 font-bold rounded-2xl transition-all ${activeTab === 'questions' ? 'bg-purple-500 text-white shadow-[0_4px_0_rgb(147,51,234)]' : 'bg-gray-50 text-gray-600 hover:bg-purple-50'}`}
        >
          ❓ Ngân Hàng Câu Hỏi
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: KHO TÀI LIỆU (Giữ nguyên y hệt) */}
      {/* ======================================================== */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-blue-100 sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>☁️</span> Tải tài liệu lên
              </h2>
              <form onSubmit={handleUploadDoc} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">File đính kèm *</label>
                  <div onClick={() => fileInputRef.current?.click()} className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${selectedFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4" />
                    {selectedFile ? (
                      <div className="text-center px-4">
                        <span className="text-3xl block mb-1">📄</span>
                        <p className="text-sm font-bold text-blue-600 truncate max-w-[200px]">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <span className="text-3xl block mb-1">📥</span>
                        <p className="text-sm font-bold">Bấm để chọn file</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tên tài liệu *</label>
                  <input name="title" required placeholder="VD: Đề cương Ôn tập" className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Loại tài liệu</label>
                  <select name="doc_type" className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 outline-none bg-white">
                    <option value="lecture">📖 Bài giảng (Lecture)</option>
                    <option value="exercise">✍️ Bài tập (Exercise)</option>
                    <option value="video">🎥 Video</option>
                  </select>
                </div>
                <button type="submit" disabled={isUploading} className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50">
                  {isUploading ? '⏳ ĐANG TẢI LÊN...' : 'LƯU TÀI LIỆU'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="text-center py-10 font-bold text-gray-400">Đang lấy dữ liệu...</div>
            ) : documents.length === 0 ? (
              <div className="bg-gray-50 rounded-3xl p-10 text-center border-2 border-dashed border-gray-300">
                <p className="font-bold text-gray-500">Chưa có tài liệu nào.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.document_id} className="bg-white p-5 rounded-2xl border-2 border-gray-100 flex items-center justify-between hover:border-blue-300 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-xl font-bold uppercase">{doc.doc_type === 'video' ? '🎥' : doc.file_ext}</div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">{doc.title}</h4>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc.storage_url && doc.storage_url !== '#' && (
                        <>
                          <a href={doc.storage_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm">👁️</a>
                          <a href={`${doc.storage_url}?download=1`} className="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-sm">⬇️</a>
                        </>
                      )}
                      <button onClick={() => handleDeleteDoc(doc.document_id)} className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: NGÂN HÀNG CÂU HỎI (MỚI KÍNH KOONG 🚀) */}
      {/* ======================================================== */}
      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">

          {/* CỘT TRÁI: FORM BIẾN HÌNH */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-purple-100 sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📝</span> Thêm câu hỏi
              </h2>
              <form onSubmit={handleCreateQuestion} className="space-y-4">

                {/* Chọn loại câu hỏi */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Loại câu hỏi</label>
                  <select value={qType} onChange={(e) => setQType(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl focus:border-purple-500 outline-none bg-purple-50 font-bold text-purple-700">
                    <option value="multiple_choice">🔘 Trắc nghiệm 4 đáp án</option>
                    <option value="true_false">⚖️ Đúng / Sai</option>
                    <option value="essay">✍️ Tự luận</option>
                  </select>
                </div>
                {/* 🎯 Ô CHỌN ẢNH MINH HỌA (MỚI) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ảnh minh họa (nếu có)</label>
                  <div
                    onClick={() => qImageInputRef.current?.click()}
                    className={`w-full h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${imagePreviewUrl ? 'border-purple-300 bg-purple-50' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    <input
                      type="file" ref={qImageInputRef} accept="image/*" className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setQuestionImage(file);
                          // Tạo link preview tạm thời để hiển thị lên màn hình
                          setImagePreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                    />
                    {imagePreviewUrl ? (
                      <div className="relative h-full p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreviewUrl} alt="Preview" className="h-full rounded-lg object-contain" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); setQuestionImage(null); setImagePreviewUrl(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs">✕</button>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400">
                        <span className="text-2xl block">🖼️</span>
                        <p className="text-xs font-medium">Bấm để thêm ảnh</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nội dung đề bài */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Đề bài *</label>
                  <textarea value={qText} onChange={(e) => setQText(e.target.value)} required rows={4} placeholder="Nhập câu hỏi của bạn..." className="w-full px-4 py-3 border-2 rounded-xl focus:border-purple-500 outline-none resize-none" />
                </div>

                {/* 🎯 GIAO DIỆN ĐỘNG CHO TRẮC NGHIỆM */}
                {/* 🎯 GIAO DIỆN ĐỘNG CHO TRẮC NGHIỆM (Nhiều đáp án & Thêm bớt tùy ý) */}
                {qType === 'multiple_choice' && (
                  <div className="space-y-3 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-gray-700">Các đáp án (Có thể chọn nhiều đáp án đúng)</label>
                      <button type="button" onClick={handleAddOption} className="text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors">
                        ➕ Thêm đáp án
                      </button>
                    </div>

                    {mcOptions.map((opt, idx) => (
                      <div key={idx} className={`flex items-center gap-2 p-2 border-2 rounded-xl transition-colors ${opt.is_correct ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                        {/* ĐỔI THÀNH CHECKBOX ĐỂ CHỌN NHIỀU */}
                        <input
                          type="checkbox"
                          checked={opt.is_correct}
                          onChange={() => handleToggleCorrectOption(idx)}
                          className="w-5 h-5 accent-green-600 cursor-pointer rounded"
                        />
                        <span className="font-bold text-gray-500 w-5">{opt.label}.</span>
                        <input
                          type="text" value={opt.text} onChange={(e) => handleUpdateOption(idx, e.target.value)}
                          placeholder={`Nhập đáp án ${opt.label}...`}
                          className="flex-1 bg-transparent outline-none text-sm font-medium" required
                        />
                        {/* NÚT XÓA ĐÁP ÁN */}
                        <button type="button" onClick={() => handleRemoveOption(idx)} className="text-gray-400 hover:text-red-500 px-2 font-bold transition-colors" title="Xóa đáp án này">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 🎯 GIAO DIỆN ĐỘNG CHO ĐÚNG/SAI */}
                {qType === 'true_false' && (
                  <div className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Đáp án đúng là gì?</label>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setTfAnswer(true)} className={`flex-1 py-2 font-bold rounded-xl border-2 transition-all ${tfAnswer ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}>✅ True (Đúng)</button>
                      <button type="button" onClick={() => setTfAnswer(false)} className={`flex-1 py-2 font-bold rounded-xl border-2 transition-all ${!tfAnswer ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}>❌ False (Sai)</button>
                    </div>
                  </div>
                )}

                {/* Thông tin phụ */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Chương học *</label>
                    <div className="flex items-center border-2 rounded-xl focus-within:border-purple-500 overflow-hidden bg-white transition-colors">
                      {/* Chữ "Chương" bị đóng đinh ở đây, không ai xóa được */}
                      <span className="px-4 py-3 bg-gray-100 text-gray-600 font-bold border-r-2">
                        Chương
                      </span>
                      {/* Ô input bị ép kiểu type="number", chỉ nhận số */}
                      <input
                        type="number"
                        min="1"
                        max="99"
                        required
                        value={qChapter}
                        onChange={(e) => setQChapter(e.target.value)}
                        placeholder="1"
                        className="w-full px-4 py-3 outline-none font-bold text-purple-700 bg-transparent"
                      />
                    </div>
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Độ khó</label>
                    <select value={qDifficulty} onChange={(e) => setQDifficulty(Number(e.target.value))} className="w-full px-4 py-3 border-2 rounded-xl focus:border-purple-500 outline-none bg-white">
                      <option value={1}>Dễ</option>
                      <option value={2}>Vừa</option>
                      <option value={3}>Khó</option>
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={isUploading} className="w-full py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50">
                  {isUploading ? '⏳ ĐANG LƯU...' : 'LƯU CÂU HỎI'}
                </button>
              </form>
            </div>
          </div>

          {/* CỘT PHẢI: DANH SÁCH CÂU HỎI */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="text-center py-10 font-bold text-gray-400">Đang lấy dữ liệu ngân hàng...</div>
            ) : questions.length === 0 ? (
              <div className="bg-purple-50 rounded-3xl p-10 text-center border-2 border-dashed border-purple-200">
                <span className="text-5xl mb-2 block">🤷</span>
                <p className="font-bold text-purple-500">Ngân hàng câu hỏi đang trống.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.question_id} className="bg-white p-5 rounded-2xl border-2 border-gray-100 hover:border-purple-300 transition-colors group relative">

                    {/* Badge loại câu hỏi */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg border">Độ khó: {q.difficulty}</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg">
                        {q.question_type === 'multiple_choice' ? 'Trắc nghiệm' : q.question_type === 'true_false' ? 'Đúng/Sai' : 'Tự luận'}
                      </span>
                    </div>

                    <div className="pr-32">
                      {/* Hiển thị ảnh minh họa */}
                      {q.content?.media && q.content.media.length > 0 && (
                        <div className="mt-4">
                          <img
                            src={q.content.media[0].url} // 🎯 Phải là .url (chứa /api/files/...)
                            alt="Minh họa câu hỏi"
                            className="max-h-64 rounded-xl border-2 border-purple-100 object-contain bg-gray-50 shadow-sm"
                            // Thêm cái này để tránh lỗi cache ảnh cũ
                            key={q.content.media[0].file_id}
                          />
                        </div>
                      )}
                      <p className="font-bold text-gray-500 text-sm mb-1">Câu {idx + 1}:</p>
                      <h4 className="font-bold text-gray-800 text-lg whitespace-pre-wrap leading-relaxed">{q.content?.text || 'Lỗi nội dung'}</h4>

                      {/* Trích xuất đáp án để hiển thị nhanh */}
                      {q.question_type === 'multiple_choice' && q.content?.options && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {q.content.options.map((opt: any, i: number) => (
                            <div key={i} className={`p-2 rounded-lg text-sm border-2 ${opt.is_correct ? 'bg-green-50 border-green-200 font-bold text-green-700' : 'bg-gray-50 border-transparent text-gray-600'}`}>
                              {opt.label}. {opt.text} {opt.is_correct && '✅'}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteQuestion(q.question_id)}
                      className="absolute bottom-4 right-4 w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      title="Xóa câu hỏi"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}