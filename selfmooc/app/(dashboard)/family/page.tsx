'use client';

import { useEffect, useState } from 'react';
import { linkChildAction, getMyChildrenAction } from '@/modules/family/controller/family.action';

export default function FamilyPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [message, setMessage] = useState('');

  // Tải danh sách con cái khi vào trang
  const loadChildren = async () => {
    const res = await getMyChildrenAction();
    if (res.success) setChildren(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadChildren();
  }, []);

  // Xử lý Form nhận con
  const handleLinkChild = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLinking(true);
    setMessage('');
    
    const formData = new FormData(e.currentTarget);
    const result = await linkChildAction(formData);
    
    setMessage(result.message);
    if (result.success) {
      (e.target as HTMLFormElement).reset(); // Xóa form
      loadChildren(); // Load lại danh sách con ngay lập tức
    }
    setIsLinking(false);
  };

  const relationshipMap: Record<string, string> = {
    'father': '👨 Bố',
    'mother': '👩 Mẹ',
    'guardian': '🛡️ Người giám hộ'
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-10">
        <span className="text-5xl">🏡</span>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
          Gia Đình Của Tôi
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI: FORM NHẬN CON */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-emerald-100 sticky top-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>➕</span> Thêm bé vào nhà
            </h2>
            
            <form onSubmit={handleLinkChild} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">🆔 Mã học sinh (Của bé)</label>
                <input name="student_code" required placeholder="VD: HS2026..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all font-mono uppercase" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">🤝 Bạn là gì của bé?</label>
                <select name="relationship" required className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all bg-white cursor-pointer">
                  <option value="mother">👩 Mẹ</option>
                  <option value="father">👨 Bố</option>
                  <option value="guardian">🛡️ Người giám hộ</option>
                </select>
              </div>

              {message && (
                <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.includes('thành công') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {message}
                </div>
              )}

              <button type="submit" disabled={isLinking} className="w-full py-4 text-lg font-black text-white rounded-2xl bg-gradient-to-r from-emerald-400 to-green-600 shadow-[0_6px_0_rgb(5,150,105)] hover:shadow-[0_4px_0_rgb(5,150,105)] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-none transition-all disabled:opacity-50">
                {isLinking ? '⏳ ĐANG TÌM BÉ...' : '✨ KẾT NỐI NGAY'}
              </button>
            </form>
          </div>
        </div>

        {/* CỘT PHẢI: DANH SÁCH CÁC CON */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="text-center mt-20 text-xl font-bold text-gray-400 animate-pulse">⏳ Đang tải danh sách thành viên...</div>
          ) : children.length === 0 ? (
            <div className="bg-gray-50 rounded-3xl p-10 text-center border-2 border-dashed border-gray-300">
              <span className="text-6xl mb-4 block">👶</span>
              <h3 className="text-xl font-bold text-gray-600">Nhà mình chưa có bé nào!</h3>
              <p className="text-gray-500 mt-2">Hãy nhập Mã Học Sinh ở bên trái để kết nối với các con nhé.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {children.map((child) => (
                <div key={child.student_id} className="bg-white rounded-3xl p-6 shadow-md border-2 border-sky-100 hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-700 font-bold px-4 py-1 rounded-bl-2xl text-sm">
                    {relationshipMap[child.relationship]}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-20 h-20 bg-yellow-200 rounded-full flex items-center justify-center text-4xl shadow-inner border-4 border-white">
                      {child.avatar_url ? <img src={child.avatar_url} className="w-full h-full object-cover rounded-full" /> : '🐶'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{child.name}</h3>
                      <p className="text-sky-600 font-mono font-bold text-sm bg-sky-50 px-2 py-1 rounded-lg inline-block mt-1">
                        ID: {child.student_code}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t-2 border-gray-50 flex gap-2">
                    <button className="flex-1 py-2 bg-sky-50 text-sky-600 font-bold rounded-xl hover:bg-sky-100 transition-colors">📊 Xem Điểm</button>
                    <button className="flex-1 py-2 bg-purple-50 text-purple-600 font-bold rounded-xl hover:bg-purple-100 transition-colors">📅 Lịch Học</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}