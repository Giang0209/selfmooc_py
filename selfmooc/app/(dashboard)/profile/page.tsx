'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
// Nhớ import 2 hàm mới vào đây nhé!
import { getProfileAction, updateProfileAction, requestOtpAction, changePasswordAction } from '@/modules/profile/controller/profile.action';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State Form Thông tin
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // State Form Đổi Pass
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passMessage, setPassMessage] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const formPassRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    async function loadProfile() {
      const res = await getProfileAction();
      if (res.success) {
        if (res.data.dob) {
          const d = new Date(res.data.dob);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          res.data.dob = `${yyyy}-${mm}-${dd}`;
        }
        setProfile({ ...res.data, role: res.role });
      }
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  // Xử lý Lưu thông tin
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    const dataObject = Object.fromEntries(new FormData(e.currentTarget).entries());
    const result = await updateProfileAction(dataObject);
    setMessage(result.message);
    setIsSaving(false);
  };

  // Xử lý Yêu cầu gửi OTP
  const handleRequestOtp = async () => {
    setPassMessage('⏳ Đang tạo mã...');
    const result = await requestOtpAction();
    if (result.success) {
      setIsOtpSent(true);
      setPassMessage(result.message);
    } else {
      setPassMessage(result.message);
    }
  };

  // Xử lý Submit Form Đổi Pass
  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsChangingPass(true);
    setPassMessage('');

    const formData = new FormData(e.currentTarget);
    const result = await changePasswordAction(formData);

    setPassMessage(result.message);
    if (result.success) {
      formPassRef.current?.reset(); // Xóa trắng ô nhập liệu
      setIsOtpSent(false); // Reset trạng thái OTP
    }
    setIsChangingPass(false);
  };

  if (isLoading) return <div className="text-center mt-20 text-2xl font-bold text-blue-500 animate-pulse">⏳ Đang tìm hồ sơ bí mật...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] w-full pb-10 mt-8">
      <div className="w-full max-w-4xl">



        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="text-4xl">🪪</span>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
            Hồ Sơ Của Tớ
          </h1>
        </div>

        {/* Khung chứa Thẻ ID và Các Form */}
        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* CỘT TRÁI: Thẻ ID Card */}
          <div className="w-full md:w-1/3 flex flex-col items-center bg-gradient-to-b from-sky-100 to-white rounded-3xl p-6 border-2 border-sky-200 shadow-xl sticky top-8">
            <div className="w-32 h-32 bg-yellow-200 rounded-full flex items-center justify-center text-6xl shadow-md mb-4 border-4 border-white overflow-hidden">
              {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : ({ 'teacher': '👩‍🏫', 'parent': '👨‍👩‍👧', 'student': '🐶' }[profile?.role as string] || '🐶')}
            </div>
            <h2 className="text-xl font-bold text-gray-800 text-center mb-1">{profile?.name}</h2>
            <p className="text-sm font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full mb-4 text-center">
              {profile?.role === 'student' && profile?.student_code ? `ID: ${profile.student_code}` : ({ 'teacher': 'Giảng viên', 'parent': 'Phụ huynh', 'student': 'Học sinh' }[profile?.role as string] || 'Thành viên')}
            </p>
          </div>

          {/* CỘT PHẢI: Chứa 2 Block Form */}
          <div className="w-full md:w-2/3 space-y-8">

            {/* --- BLOCK 1: THÔNG TIN CƠ BẢN --- */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-purple-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><span>📝</span> Thông tin cơ bản</h3>
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">🏷️ Họ và tên</label>
                  <input name="name" defaultValue={profile?.name} required className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all" />
                </div>
                {profile?.role !== 'student' ? (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📧 Email</label>
                    <input
                      defaultValue={profile?.email}
                      disabled
                      className="w-full px-4 py-3 text-base border-2 border-gray-100 bg-gray-50 rounded-2xl text-gray-400 cursor-not-allowed"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">🎓 MSSV</label>
                    <input
                      defaultValue={profile?.student_code || ''}
                      disabled
                      className="w-full px-4 py-3 text-base border-2 border-gray-100 bg-gray-50 rounded-2xl text-gray-600 font-bold cursor-not-allowed"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📞 Số điện thoại</label>
                    <input
                      name="phone"
                      defaultValue={profile?.phone || ''}
                      disabled={profile?.role === 'student'}
                      className={
                        profile?.role === 'student'
                          ? "w-full px-4 py-3 text-base border-2 border-gray-100 bg-gray-50 rounded-2xl text-gray-400 cursor-not-allowed focus:outline-none"
                          : "w-full px-4 py-3 text-base border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">🎂 Ngày sinh nhật</label>
                    <input type="date" name="dob" defaultValue={profile?.dob || ''} className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all" />
                  </div>
                </div>
                {message && <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.includes('thành công') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{message}</div>}
                <button type="submit" disabled={isSaving} className="w-full py-4 px-4 text-lg font-black text-white rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_6px_0_rgb(147,51,234)] hover:shadow-[0_4px_0_rgb(147,51,234)] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-none transition-all disabled:opacity-50">
                  {isSaving ? '⏳ ĐANG LƯU...' : '💾 LƯU THÔNG TIN'}
                </button>
              </form>
            </div>

            {/* --- BLOCK 2: ĐỔI MẬT KHẨU --- */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-rose-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><span>🔐</span> Đổi mật khẩu bí mật</h3>

              {/* Nếu là người lớn & chưa gửi OTP -> Hiện nút Lấy OTP */}
              {(profile?.role === 'teacher' || profile?.role === 'parent') && !isOtpSent ? (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-4">Để đảm bảo an toàn, chúng tôi cần gửi một mã xác nhận (OTP) vào email của bạn.</p>
                  <button onClick={handleRequestOtp} className="w-full py-4 px-4 text-lg font-black text-rose-600 bg-rose-100 border-2 border-rose-200 rounded-2xl hover:bg-rose-200 transition-all">
                    📩 NHẬN MÃ XÁC NHẬN (OTP)
                  </button>
                  {passMessage && <div className="mt-4 p-3 rounded-xl text-sm font-bold bg-blue-100 text-blue-600">{passMessage}</div>}
                </div>
              ) : (
                /* Form nhập Pass (Hiện ngay nếu là học sinh, hoặc đã lấy OTP) */
                <form ref={formPassRef} onSubmit={handlePasswordSubmit} className="space-y-5 animate-fade-in-down">

                  {/* Ô nhập Mật khẩu Cũ (Ai cũng phải nhập) */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">🔒 Mật khẩu hiện tại</label>
                    <input name="old_password" type="password" required placeholder="Nhập mật khẩu đang dùng..." className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100 transition-all" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Ô nhập Mật khẩu Mới */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">🔑 Mật khẩu mới</label>
                      <input name="new_password" type="password" required minLength={6} placeholder="Ít nhất 6 ký tự..." className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100 transition-all" />
                    </div>

                    {/* Ô Nhập lại Mật khẩu Mới */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">✅ Nhập lại mật khẩu mới</label>
                      <input name="confirm_new_password" type="password" required minLength={6} placeholder="Gõ lại y hệt bên kia..." className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100 transition-all" />
                    </div>
                  </div>

                  {/* Ô nhập OTP (Chỉ hiện cho người lớn) */}
                  {(profile?.role === 'teacher' || profile?.role === 'parent') && (
                    <div className="pt-2">
                      <label className="block text-sm font-bold text-rose-600 mb-2">📩 Mã xác nhận OTP (Kiểm tra Email)</label>
                      <input name="otp_code" type="text" required placeholder="Nhập 6 số..." maxLength={6} className="w-full px-4 py-3 text-center text-xl tracking-widest font-black border-2 border-rose-200 bg-rose-50 rounded-2xl focus:outline-none focus:border-rose-500 transition-all" />
                    </div>
                  )}

                  {passMessage && <div className={`p-3 rounded-xl text-sm font-bold text-center ${passMessage.includes('thành công') ? 'bg-green-100 text-green-600 border-2 border-green-300' : 'bg-red-100 text-red-600 border-2 border-red-300'}`}>{passMessage}</div>}

                  <button type="submit" disabled={isChangingPass} className="w-full py-4 px-4 text-lg font-black text-white rounded-2xl bg-gradient-to-r from-rose-400 to-rose-600 shadow-[0_6px_0_rgb(225,29,72)] hover:shadow-[0_4px_0_rgb(225,29,72)] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-none transition-all disabled:opacity-50 mt-4">
                    {isChangingPass ? '⏳ ĐANG XỬ LÝ...' : '💥 ĐỔI MẬT KHẨU NGAY!'}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}