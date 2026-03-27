'use client';

import { useEffect, useState } from 'react';
import { getProfileAction, updateProfileAction } from '@/modules/auth/controller/profile.action'; // Kiểm tra lại đường dẫn import này nhé!
import { useRouter } from 'next/navigation';
export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Lấy dữ liệu khi vừa vào trang
  useEffect(() => {
    async function loadProfile() {
      const res = await getProfileAction();
      if (res.success) {
        // Cắt bớt phần giờ phút nếu có để đưa vào input type="date"
        if (res.data.dob) res.data.dob = new Date(res.data.dob).toISOString().split('T')[0];
        setProfile(res.data);
      }
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  // Xử lý khi bấm nút Lưu
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    const formData = new FormData(e.currentTarget);
    const dataObject = Object.fromEntries(formData.entries());

    const result = await updateProfileAction(dataObject);
    setMessage(result.message);
    setIsSaving(false);
  };

  if (isLoading) return <div className="text-center mt-20 text-2xl font-bold text-blue-500 animate-pulse">⏳ Đang tìm hồ sơ bí mật...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      {/*Nút quay lại*/}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 px-5 py-2.5 bg-white text-gray-600 font-bold rounded-2xl border-2 border-gray-200 hover:bg-gray-50 hover:border-sky-300 hover:text-sky-600 hover:-translate-x-1 transition-all shadow-sm">
        <span className="text-xl">⬅️</span>
        Quay lại chỗ cũ
      </button>
      {/* Tiêu đề trang */}
      <div className="flex items-center gap-3 mb-8">
        <span className="text-4xl">🪪</span>
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
          Hồ Sơ Của Tớ
        </h1>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl p-8 border-4 border-purple-100 flex flex-col md:flex-row gap-8">
        
        {/* CỘT TRÁI: Thẻ ID Card */}
        <div className="md:w-1/3 flex flex-col items-center justify-center bg-gradient-to-b from-sky-100 to-white rounded-3xl p-6 border-2 border-sky-200 shadow-inner">
          <div className="w-32 h-32 bg-yellow-200 rounded-full flex items-center justify-center text-6xl shadow-md mb-4 border-4 border-white">
            {profile?.avatar_url ? <img src={profile.avatar_url} className="rounded-full" /> : '🐶'}
          </div>
          <h2 className="text-xl font-bold text-gray-800 text-center mb-1">{profile?.name}</h2>
          <p className="text-sm font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full mb-4">
            {profile?.student_code ? `ID: ${profile.student_code}` : 'Thành viên SelfMOOC'}
          </p>
          <div className="text-sm text-gray-500 text-center">
            Tham gia vào cuộc phiêu lưu tri thức! 🚀
          </div>
        </div>

        {/* CỘT PHẢI: Form chỉnh sửa */}
        <div className="md:w-2/3">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Tên */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🏷️ Họ và tên</label>
              <input 
                name="name" 
                defaultValue={profile?.name} 
                required
                className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all" 
              />
            </div>

            {/* Email (Khóa, không cho sửa) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">📧 Email (Bất di bất dịch)</label>
              <input 
                defaultValue={profile?.email} 
                disabled
                className="w-full px-4 py-3 text-base border-2 border-gray-100 bg-gray-50 rounded-2xl text-gray-400 cursor-not-allowed" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Số điện thoại */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">📞 Số điện thoại</label>
                <input 
                  name="phone" 
                  defaultValue={profile?.phone || ''} 
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all" 
                />
              </div>

              {/* Ngày sinh */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">🎂 Ngày sinh nhật</label>
                <input 
                  type="date"
                  name="dob" 
                  defaultValue={profile?.dob || ''} 
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all" 
                />
              </div>
            </div>

            {/* Thông báo lưu thành công/thất bại */}
            {message && (
              <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.includes('thành công') ? 'bg-green-100 text-green-600 border-2 border-green-300' : 'bg-red-100 text-red-600 border-2 border-red-300'}`}>
                {message}
              </div>
            )}

            {/* Nút Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className={`w-full py-4 px-4 text-lg font-black text-white rounded-2xl transition-all ${
                  isSaving 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_6px_0_rgb(147,51,234)] hover:shadow-[0_4px_0_rgb(147,51,234)] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-none'
                }`}
              >
                {isSaving ? '⏳ ĐANG LƯU...' : '💾 LƯU THÔNG TIN NHÉ!'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}