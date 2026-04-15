'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
// Nhớ import hàm logout vừa viết nhé (sửa đường dẫn nếu cần)
import { logoutAction } from '@/modules/auth/controller/auth.action';

const MENUS = {
  student: [
    { name: 'Bảng Của Tớ', icon: '🏠', path: '/' },
    { name: 'Lớp học', icon: '📚', path: '/classes' },
    { name: 'Thử Thách', icon: '🏆', path: '/challenges' },
    { name: 'Nhật Ký', icon: '📝', path: '/diary' },
    { name: 'Hồ Sơ', icon: '🪪', path: '/profile' },
  ],
  teacher: [
    { name: 'Trang chủ', icon: '🏠', path: '/' },
    { name: 'Lớp Học', icon: '🏫', path: '/classes' },
    { name: 'Khóa Học', icon: '📚', path: '/courses' },
    { name: 'Chấm Bài', icon: '✅', path: '/grading' },
    // { name: 'Học Sinh', icon: '👥', path: '/students' },
    { name: 'Báo Cáo', icon: '📊', path: '/reports' },
    { name: 'Hồ Sơ', icon: '🪪', path: '/profile' },
  ],
  parent: [
    { name: 'Tổng Quan', icon: '👁️', path: '/' },
    { name: 'Gia Đình', icon: '👨‍👩‍👧‍👦', path: '/family' },
    { name: 'Kết Quả', icon: '📈', path: '/progress' },
    { name: 'Lịch Học', icon: '📅', path: '/schedule' },
    { name: 'Nhắn Tin', icon: '💬', path: '/messages' },
    { name: 'Hồ Sơ', icon: '🪪', path: '/profile' },
  ],
};

const ROLE_NAMES = {
  student: 'Học sinh',
  teacher: 'Giáo viên',
  parent: 'Phụ huynh',
};

export default function Sidebar({ role = 'student' }: { role?: 'student' | 'teacher' | 'parent' }) {
  const pathname = usePathname();
  const router = useRouter(); // Gọi bộ chuyển hướng
  const currentMenu = MENUS[role] || MENUS.student;

  // HÀM XỬ LÝ ĐĂNG XUẤT
  const handleLogout = async () => {
    // 1. Gọi API xé thẻ Cookie
    await logoutAction();
    
    // 2. Ép trình duyệt đá văng ra trang Login
    router.push('/login');
    
    // 3. Làm mới lại toàn bộ trang để xóa sạch tàn dư dữ liệu cũ
    router.refresh();
  };

  return (
    <aside className="w-64 bg-white border-r-4 border-sky-100 flex flex-col p-4 shadow-xl z-20">
      {/* Logo */}
      <div className="flex flex-col items-center justify-center gap-1 mb-8 mt-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl animate-bounce">🚀</span>
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
            SelfMOOC
          </h1>
        </div>
        <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Phân quyền: {ROLE_NAMES[role]}
        </span>
      </div>

      {/* Danh sách Menu */}
      <nav className="flex-1 space-y-3">
        {currentMenu.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all transform hover:-translate-y-1 hover:shadow-md ${
                isActive 
                  ? 'bg-blue-400 text-white shadow-[0_4px_0_rgb(37,99,235)]' 
                  : 'bg-gray-50 text-gray-600 hover:bg-blue-50'
              }`}>
                <span className="text-2xl drop-shadow-sm">{item.icon}</span>
                <span className="text-lg">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Nút Đăng xuất */}
      <div className="mt-auto pt-4 border-t-4 border-gray-100">
        {/* Gắn sự kiện onClick={handleLogout} vào đây */}
        <button 
          onClick={handleLogout} 
          className="flex w-full items-center justify-center gap-2 px-4 py-4 bg-rose-100 text-rose-600 font-bold rounded-2xl hover:bg-rose-200 hover:-translate-y-1 hover:shadow-[0_4px_0_rgb(225,29,72)] transition-all"
        >
          <span className="text-xl">🚪</span>
          Thoát ra
        </button>
      </div>
    </aside>
  );
}