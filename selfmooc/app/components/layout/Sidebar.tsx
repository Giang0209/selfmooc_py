'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutAction } from '@/modules/auth/controller/auth.action';
import { useState } from 'react';

const MENUS = {
  student: [
    { name: 'Bảng Của Tớ', icon: '🏠', path: '/' },
    { name: 'Lớp học', icon: '📚', path: '/classes' },
    { name: 'Lịch Học', icon: '📅', path: '/schedule' },
    { name: 'Nhật Ký', icon: '📝', path: '/diary' },
    { name: 'Hồ Sơ', icon: '🪪', path: '/profile' },
  ],
  teacher: [
    { name: 'Trang chủ', icon: '🏠', path: '/' },
    { name: 'Khóa Học', icon: '📚', path: '/courses' },
    { name: 'Lớp Học', icon: '🏫', path: '/classes' },
    { name: 'Lịch Dạy', icon: '📅', path: '/schedule' },
    { name: 'Chấm Bài', icon: '✅', path: '/grading' },
    { name: 'Nhắn tin', icon: '💬', path: '/chats' },
    { name: 'Hồ Sơ', icon: '🪪', path: '/profile' },
  ],
  parent: [
    { name: 'Tổng Quan', icon: '👁️', path: '/' },
    { name: 'Gia Đình', icon: '👨‍👩‍👧‍👦', path: '/family' },
    { name: 'Nhắn Tin', icon: '💬', path: '/chats' },
    { name: 'Hồ Sơ', icon: '🪪', path: '/profile' },
  ],
};

const ROLE_NAMES = {
  student: 'Học sinh',
  teacher: 'Giáo viên',
  parent: 'Phụ huynh',
};

export default function Sidebar({
  role = 'student',
}: {
  role?: 'student' | 'teacher' | 'parent';
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const currentMenu = MENUS[role] || MENUS.student;

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  const ITEM_BASE =
    'flex items-center justify-center w-full rounded-2xl font-bold transition-all hover:-translate-y-1 hover:shadow-md';

  return (
    <aside
      className={`bg-white border-r-4 border-sky-100 flex flex-col p-4 shadow-xl z-20 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
        }`}
    >

      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-3 mb-6 mt-2">

        {/* 1. TOGGLE (trên cùng) */}
        <div className="flex justify-center">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-black text-xl"
          >
            {collapsed ? '⏩' : '⏪'}
          </button>
        </div>

        {/* 2. LOGO */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl animate-bounce">🚀</span>

          {!collapsed && (
            <span className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-purple-500">
              SelfMOOC
            </span>
          )}
        </div>

        {/* 3. ROLE */}
        {!collapsed && (
          <div className="flex justify-center">
            <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Phân quyền: {ROLE_NAMES[role]}
            </span>
          </div>
        )}
      </div>

      {/* ================= MENU ================= */}
      <nav className="flex-1 flex flex-col gap-3 items-center">

        {currentMenu.map((item) => {
          const isActive = pathname === item.path;

          return (
            <Link key={item.path} href={item.path} className="w-full">
              <div
                className={`${ITEM_BASE} ${collapsed ? 'h-12 px-0' : 'px-4 py-4 gap-4'
                  } ${isActive
                    ? 'bg-blue-400 text-white shadow-[0_4px_0_rgb(37,99,235)]'
                    : 'bg-gray-50 text-gray-600 hover:bg-blue-50'
                  }`}
              >
                <span className="text-2xl">{item.icon}</span>

                {!collapsed && (
                  <span className="text-lg">{item.name}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ================= LOGOUT ================= */}
      <div className="mt-auto pt-4 border-t-4 border-gray-100 flex justify-center w-full">

        <button
          onClick={handleLogout}
          className={`${ITEM_BASE} ${collapsed ? 'h-12 px-0' : 'px-4 py-4 gap-2'
            } bg-rose-100 text-rose-600 hover:bg-rose-200`}
        >
          <span className="text-xl">🚪</span>

          {!collapsed && <span>Thoát ra</span>}
        </button>

      </div>
    </aside>
  );
}