'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Lưu ý: Đảm bảo đường dẫn import này khớp với cấu trúc thư mục của bạn
import { loginAction, registerAction } from '@/modules/auth/controller/auth.action'; 

type FormMode = 'login' | 'register';
type Role = 'student' | 'teacher' | 'parent';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<FormMode>('login');
  const [role, setRole] = useState<Role>('student');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleMode = () => {
    setErrorMsg('');
    if (mode === 'login') {
      setMode('register');
      setRole('teacher'); 
    } else {
      setMode('login');
      setRole('student'); 
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    setErrorMsg('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget); 
    
    // ĐÂY LÀ DÒNG FIX LỖI "Vui lòng nhập email":
    // Chuyển FormData của HTML thành một Object JSON bình thường để Zod có thể đọc được
    const dataObject = Object.fromEntries(formData.entries());

    try {
      let result;
      if (mode === 'login') {
        result = await loginAction(dataObject);
      } else {
        result = await registerAction(dataObject);
      }

      if (result?.success) {
        // Đăng nhập thành công -> Bay thẳng vào trang chủ
        router.push('/');
        router.refresh(); 
      } else {
        setErrorMsg(result?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Lỗi kết nối đến hệ thống!');
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-sky-300 via-purple-300 to-pink-300 py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Trang trí background */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 max-w-md w-full space-y-8 bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-[2rem] shadow-2xl border-4 border-white">
        
        {/* Tiêu đề */}
        <div>
          <h2 className="mt-2 flex items-center justify-center gap-2 text-center text-3xl sm:text-4xl font-extrabold pb-1">
            <span className="text-blue-500 drop-shadow-md">🌟</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {mode === 'login' ? 'Vô Học Thôi!' : 'Tạo Tài Khoản'}
            </span>
            <span className="text-purple-500 drop-shadow-md">🌟</span>
          </h2>
          <p className="mt-3 text-center text-base font-medium text-gray-600">
            {mode === 'login' 
              ? 'Nhập thông tin bí mật của bạn vào nhé!' 
              : 'Dành riêng cho Thầy Cô và Bố Mẹ.'}
          </p>
        </div>

        {/* TABS CHỌN VAI TRÒ */}
        <div className="flex justify-between gap-2 bg-gray-100 p-2 rounded-2xl">
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => { setRole('student'); setErrorMsg(''); }}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all transform ${
                role === 'student' ? 'bg-yellow-400 text-yellow-900 shadow-[0_4px_0_rgb(202,138,4)] -translate-y-1' : 'bg-white text-gray-500 shadow-sm hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <span className="text-2xl mb-1 drop-shadow-sm">👦</span>
              <span className="text-sm font-bold whitespace-nowrap">Học sinh</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => { setRole('teacher'); setErrorMsg(''); }}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all transform ${
              role === 'teacher' ? 'bg-blue-400 text-blue-900 shadow-[0_4px_0_rgb(37,99,235)] -translate-y-1' : 'bg-white text-gray-500 shadow-sm hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <span className="text-2xl mb-1 drop-shadow-sm">👩‍🏫</span>
            <span className="text-sm font-bold whitespace-nowrap">Giáo viên</span>
          </button>

          <button
            type="button"
            onClick={() => { setRole('parent'); setErrorMsg(''); }}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all transform ${
              role === 'parent' ? 'bg-green-400 text-green-900 shadow-[0_4px_0_rgb(22,163,74)] -translate-y-1' : 'bg-white text-gray-500 shadow-sm hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <span className="text-2xl mb-1 drop-shadow-sm">👨‍👩‍👧</span>
            <span className="text-sm font-bold whitespace-nowrap">Phụ huynh</span>
          </button>
        </div>

        {/* FORM NHẬP LIỆU */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <input type="hidden" name="role" value={role} />

          <div className="space-y-5">
            {/* Tên: Chỉ hiện khi Đăng ký */}
            {mode === 'register' && (
              <div className="animate-fade-in-down">
                <label className="block text-sm font-bold text-gray-700 mb-2">🏷️ Họ và tên</label>
                <input name="name" type="text" className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400" placeholder="Nhập tên của bạn..." />
              </div>
            )}

            {/* Tài khoản đăng nhập: Học sinh dùng ID, Người lớn dùng Email */}
            {role === 'student' && mode === 'login' ? (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">🆔 Mã Học Sinh (ID)</label>
                <input 
                  name="student_code" 
                  type="text" 
                  className="w-full px-4 py-3 text-base font-bold text-gray-900 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 transition-all placeholder-gray-400" 
                  placeholder="VD: HS2026..." 
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">📧 Địa chỉ Email</label>
                <input 
                  name="email" 
                  type="text" 
                  className="w-full px-4 py-3 text-base font-bold text-gray-900 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400" 
                  placeholder="name@example.com" 
                />
              </div>
            )}

            {/* Mật khẩu: Ai cũng phải nhập */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🔑 Mật khẩu bí mật</label>
              <input 
                name="password_raw" 
                type="password" 
                className="w-full px-4 py-3 text-base font-bold text-gray-900 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all placeholder-gray-400 tracking-widest" 
                placeholder="••••••••" 
              />
            </div>

            {/* Nhập lại mật khẩu: CHỈ HIỆN KHI ĐĂNG KÝ */}
            {mode === 'register' && (
              <div className="animate-fade-in-down">
                <label className="block text-sm font-bold text-gray-700 mb-2">✅ Nhập lại mật khẩu</label>
                <input 
                  name="confirm_password_raw" 
                  type="password" 
                  className="w-full px-4 py-3 text-base font-bold text-gray-900 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all placeholder-gray-400 tracking-widest" 
                  placeholder="Gõ lại y hệt bên trên nha..." 
                />
              </div>
            )}
          </div>

          {/* HIỂN THỊ LỖI */}
          {errorMsg && (
            <div className="p-3 bg-red-100 border-2 border-red-300 rounded-xl text-red-600 text-sm font-bold text-center animate-pulse">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-4 text-lg font-black text-white rounded-2xl transition-all 
                ${isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_6px_0_rgb(192,38,211)] hover:shadow-[0_4px_0_rgb(192,38,211)] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px]'
                }`}
            >
              {isLoading ? '⏳ ĐANG XỬ LÝ...' : (mode === 'login' ? '🚀 ĐĂNG NHẬP NGAY!' : '✨ TẠO TÀI KHOẢN!')}
            </button>
          </div>
        </form>

        {/* Nút Đảo chiều */}
        <div className="text-center mt-6 pt-4 border-t-2 border-gray-100">
          <p className="text-sm font-medium text-gray-600">
            {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <button type="button" onClick={toggleMode} className="font-bold text-purple-600 hover:text-pink-500 transition-colors underline decoration-2 underline-offset-4">
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}