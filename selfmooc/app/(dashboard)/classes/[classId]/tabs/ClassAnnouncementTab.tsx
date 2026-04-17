'use client';

import { useEffect, useState, useRef } from 'react';
import { createAnnouncementAction, getAnnouncementsAction, deleteAnnouncementAction, updateAnnouncementAction } from '@/modules/announcements/controller/announcement.action';

export default function ClassAnnouncementTab({ classId }: { classId: number }) {
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
      result = await updateAnnouncementAction(editingId, payload);
    } else {
      result = await createAnnouncementAction(classId, payload);
    }

    setMessage(result.message);

    if (result.success) {
      handleCancelEdit();
      loadAnnouncements();
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
    setEditingId(ann._id);

    if (formRef.current) {
      formRef.current.title.valueOf = ann.title;
      formRef.current.body.value = ann.body;
      formRef.current.is_pinned.checked = ann.is_pinned;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMessage('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    if (formRef.current) {
      formRef.current.reset();
    }
    setMessage('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* CỘT TRÁI: FORM */}
      <div className="lg:col-span-1">
        <div className={`rounded-3xl p-6 border-2 sticky top-8 shadow-sm transition-colors ${editingId ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-100'}`}>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span>{editingId ? '✏️' : '✍️'}</span>
            {editingId ? 'Sửa thông báo' : 'Gửi thông báo mới'}
          </h2>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">📌 Tiêu đề</label>
              <input name="title" required className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white transition-colors text-gray-800 font-bold" placeholder="Nhập tiêu đề..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">📝 Nội dung</label>
              <textarea name="body" required rows={5} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white transition-colors text-gray-700 font-medium resize-none" placeholder="Nội dung thông báo..." />
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-100/50 transition-colors">
              <input type="checkbox" name="is_pinned" id="is_pinned" className="w-5 h-5 accent-amber-500 rounded cursor-pointer" />
              <label htmlFor="is_pinned" className="text-sm font-bold text-amber-600 cursor-pointer select-none">⭐ Đánh dấu quan trọng</label>
            </div>

            {message && <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-sm font-bold text-center text-sky-600">{message}</div>}

            <div className="flex gap-2">
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="w-1/3 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                  Hủy
                </button>
              )}
              <button type="submit" disabled={isSubmitting} className={`flex-1 py-4 text-white font-bold rounded-xl transition-all shadow-[0_4px_0_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none disabled:opacity-50 ${editingId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-600' : 'bg-sky-500 hover:bg-sky-600 shadow-[0_4px_0_rgb(14,165,233)]'}`}>
                {isSubmitting ? '⏳ ĐANG XỬ LÝ...' : (editingId ? '💾 LƯU THAY ĐỔI' : '🚀 GỬI CHO LỚP')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CỘT PHẢI: DANH SÁCH */}
      <div className="lg:col-span-2 space-y-4">
        {isLoading ? (
          <div className="text-center py-10 font-bold text-sky-500 animate-pulse">Đang tải thông báo...</div>
        ) : announcements.length === 0 ? (
          <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-gray-200 border-dashed">
            <span className="text-5xl mb-4 block grayscale opacity-50">📭</span>
            <h3 className="text-xl font-bold text-gray-400">Lớp chưa có thông báo nào!</h3>
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann._id} className="bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-sm relative overflow-hidden group hover:border-sky-300 transition-colors">
              {ann.is_pinned && <div className="absolute top-0 right-0 bg-amber-100 text-amber-600 font-bold px-4 py-1 rounded-bl-2xl text-xs border-b border-l border-amber-200">⭐ QUAN TRỌNG</div>}

              <div className="flex gap-4">
                <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-2xl shrink-0 border border-sky-100">🔔</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 pr-20">{ann.title}</h3>
                  <p className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2"><span>🕒</span> {formatDate(ann.created_at)}</p>
                  <div className="text-gray-700 font-medium bg-gray-50 p-4 rounded-2xl border border-gray-100 whitespace-pre-wrap leading-relaxed">{ann.body}</div>

                  {/* NÚT SỬA / XÓA (Hiện khi Hover) */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(ann)} className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-amber-500 hover:text-white transition-colors text-sm">✏️ Sửa</button>
                    <button onClick={() => handleDelete(ann._id)} className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-rose-500 hover:text-white transition-colors text-sm">🗑️ Xóa</button>
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