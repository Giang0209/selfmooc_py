'use client';

import { useEffect, useState, useRef } from 'react';
import { createAnnouncementAction, getAnnouncementsAction, deleteAnnouncementAction, updateAnnouncementAction } from '@/modules/announcements/controller/announcement.action';

export default function ClassAnnouncementPage({ classId }: { classId: number }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    const res = await getAnnouncementsAction(classId);
    if (res.success) setAnnouncements(res.data);
    setIsLoading(false);
  };

  useEffect(() => { loadAnnouncements(); }, [classId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get('title') as string,
      body: formData.get('body') as string,
      is_pinned: formData.get('is_pinned') === 'on'
    };

    let result;
    if (editingId) {
      // Đang có editingId -> Gọi API Cập nhật
      result = await updateAnnouncementAction(editingId, payload);
    } else {
      // Không có editingId -> Gọi API Tạo mới
      result = await createAnnouncementAction(classId, payload);
    }

    setMessage(result.message);

    if (result.success) {
      // 🎯 Thành công rồi thì gọi hàm Reset Form ngay lập tức
      handleCancelEdit();
      loadAnnouncements(); // Load lại danh sách bên phải
    }

    setIsSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(dateString));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('⚠️ Bạn có chắc chắn muốn xóa thông báo này?')) {
      const res = await deleteAnnouncementAction(id);
      if (res.success) {
        setAnnouncements(prev => prev.filter(a => a._id !== id));
      } else {
        alert(res.message);
      }
    }
  };
  const handleEditClick = (ann: any) => {
    setEditingId(ann._id); // Lúc này ann._id đã là String xịn nhờ Bước 1

    if (formRef.current) {
      formRef.current.title.valueOf = ann.title;
      formRef.current.body.value = ann.body;
      formRef.current.is_pinned.checked = ann.is_pinned;
    }

    // Cuộn lên đầu trang cho Giảng viên dễ nhìn
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMessage('');
  };

  const handleCancelEdit = () => {
    setEditingId(null); // Tắt chế độ "Sửa"
    if (formRef.current) {
      formRef.current.reset(); // Xóa sạch chữ trong ô nhập
    }
    setMessage(''); // Xóa dòng thông báo xanh/đỏ
  };



  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* CỘT TRÁI: FORM */}
      <div className="lg:col-span-1">
        <div className={`rounded-3xl p-6 border sticky top-8 shadow-xl transition-colors ${editingId ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-800 border-slate-700'}`}>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span>{editingId ? '✏️' : '✍️'}</span>
            {editingId ? 'Sửa thông báo' : 'Gửi thông báo mới'}
          </h2>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">📌 Tiêu đề</label>
              <input name="title" required className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl focus:outline-none focus:border-sky-500 text-white" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">📝 Nội dung</label>
              <textarea name="body" required rows={5} className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl focus:outline-none focus:border-sky-500 text-white resize-none" />
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 cursor-pointer">
              <input type="checkbox" name="is_pinned" id="is_pinned" className="w-5 h-5 accent-amber-500 rounded cursor-pointer" />
              <label htmlFor="is_pinned" className="text-sm font-bold text-amber-400 cursor-pointer select-none">⭐ Đánh dấu quan trọng</label>
            </div>

            {message && <div className="p-3 bg-slate-900 rounded-xl text-sm font-bold text-center text-sky-400">{message}</div>}

            <div className="flex gap-2">
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="w-1/3 py-4 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600">
                  Hủy
                </button>
              )}
              <button type="submit" disabled={isSubmitting} className={`flex-1 py-4 text-white font-bold rounded-xl transition-colors disabled:opacity-50 ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-sky-500 hover:bg-sky-600'}`}>
                {isSubmitting ? '⏳ ĐANG XỬ LÝ...' : (editingId ? '💾 LƯU THAY ĐỔI' : '🚀 GỬI CHO LỚP')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CỘT PHẢI: DANH SÁCH */}
      <div className="lg:col-span-2 space-y-4">
        {isLoading ? (
          <div className="text-center py-10 font-bold text-slate-400 animate-pulse">Đang tải thông báo...</div>
        ) : announcements.length === 0 ? (
          <div className="bg-slate-800 rounded-3xl p-12 text-center border border-slate-700 border-dashed">
            <span className="text-5xl mb-4 block">📭</span>
            <h3 className="text-xl font-bold text-slate-300">Lớp chưa có thông báo nào!</h3>
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann._id} className="bg-slate-800 rounded-3xl p-6 border border-slate-700 relative overflow-hidden group hover:border-sky-500/50 transition-colors">
              {ann.is_pinned && <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-400 font-bold px-4 py-1 rounded-bl-2xl text-xs border-b border-l border-amber-500/30">⭐ QUAN TRỌNG</div>}

              <div className="flex gap-4">
                <div className="w-14 h-14 bg-sky-500/20 rounded-2xl flex items-center justify-center text-2xl shrink-0 border border-sky-500/30">🔔</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white pr-20">{ann.title}</h3>
                  <p className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2"><span>🕒</span> {formatDate(ann.created_at)}</p>
                  <div className="text-slate-300 bg-slate-900 p-4 rounded-2xl border border-slate-700 whitespace-pre-wrap leading-relaxed">{ann.body}</div>

                  {/* NÚT SỬA / XÓA (Hiện khi Hover) */}
                  <div className="mt-4 pt-4 border-t border-slate-700 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(ann)} className="px-4 py-2 bg-slate-700 text-white font-bold rounded-xl hover:bg-amber-500 transition-colors text-sm">✏️ Sửa</button>
                    <button onClick={() => handleDelete(ann._id)} className="px-4 py-2 bg-slate-700 text-rose-400 font-bold rounded-xl hover:bg-rose-500 hover:text-white transition-colors text-sm">🗑️ Xóa</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}