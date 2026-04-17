'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // 🎯 1. Import useRouter để chuyển trang
import { getMyNotificationsAction, markAsReadAction } from '@/modules/notifications/notification.action';

export default function Header({ user }: { user?: any }) {
  const router = useRouter();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // State cho thanh tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');

  // State tạm thời cho nút chuyển chế độ (Sẽ xử lý logic ở bước sau)
  const [isDarkMode, setIsDarkMode] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (user) {
      getMyNotificationsAction().then(res => {
        if (res.success) setNotifications(res.data);
      });
    }
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const handleNotifClick = async (notif: any) => {
    if (!notif.is_read) {
      const res = await markAsReadAction(notif._id);
      if (res.success) {
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, is_read: true } : n));
      }
    }
  };

  // 🎯 2. Hàm xử lý khi người dùng ấn Enter ở thanh tìm kiếm
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Chuyển hướng sang trang kết quả tìm kiếm
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(''); // Xóa thanh tìm kiếm sau khi enter
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b-4 border-sky-100 px-8 py-4 flex items-center justify-between sticky top-0 z-[100] shadow-sm">

      {/* CỘT TRÁI: Lời chào */}
      <div className="flex items-center gap-3 animate-fade-in">
        <span className="text-3xl origin-bottom-right animate-wave">👋</span>
        <div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{getGreeting()}</p>
          <h2 className="text-xl font-extrabold text-gray-800">
            {user?.name ? `${user.name} ơi!` : 'Nhà thám hiểm ơi!'}
          </h2>
        </div>
      </div>

      {/* CỘT PHẢI: Tìm kiếm, Thông báo, Theme & Avatar */}
      <div className="flex items-center gap-4 md:gap-6">

        <div className="flex items-center gap-3">
          {/* 🎯 4. NÚT CHUYỂN THEME (Chuẩn bị cho bước sau) */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 bg-white text-xl rounded-xl hover:bg-gray-50 hover:-translate-y-1 transition-all border-2 border-gray-100 shadow-sm text-gray-600"
            title="Chuyển chế độ sáng/tối"
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>

          {/* 🎯 5. NÚT CHUÔNG ĐÃ CHUYỂN SANG MÀU TRẮNG */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2.5 bg-white text-amber-500 rounded-xl hover:bg-gray-50 hover:-translate-y-1 transition-all border-2 border-gray-100 shadow-sm"
            >
              <span className="text-xl drop-shadow-sm">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 border-2 border-white rounded-full animate-pulse flex items-center justify-center text-[10px] text-white font-black shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* BOX DROPDOWN THÔNG BÁO (Tạm giữ UI Dark Mode cũ, sẽ đồng bộ sau) */}
            {showNotifs && (
              <div className="absolute right-0 mt-4 w-[420px] bg-slate-800 border border-slate-700 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-fade-in-down">
                <div className="p-5 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                  <h3 className="text-lg font-black text-white whitespace-nowrap">Thông báo</h3>
                  <span className="text-xs bg-sky-500/20 text-sky-400 px-3 py-1 rounded-lg font-bold">{unreadCount} mới</span>
                </div>

                {/* Danh sách thông báo */}
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 font-bold">
                      <span className="text-4xl block mb-2">📭</span>
                      Chưa có thông báo nào
                    </div>
                  ) : (
                    <div className="divide-y-2 divide-gray-50">
                      {notifications.map(n => (
                        <div
                          key={n._id}
                          onClick={() => handleNotifClick(n)}
                          // 🎯 Nền xanh nhạt nếu chưa đọc, nền trắng nếu đã đọc
                          className={`p-5 hover:bg-gray-50 cursor-pointer transition-colors ${!n.is_read ? 'bg-sky-50/50' : 'bg-white'}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className={`text-base pr-4 ${!n.is_read ? 'font-bold text-gray-800' : 'font-bold text-gray-500'}`}>
                              {n.title}
                            </h4>
                            {/* Chấm đỏ báo chưa đọc */}
                            {!n.is_read && (
                              <div className="w-2.5 h-2.5 bg-rose-500 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
                            )}
                          </div>
                          <p className={`text-sm line-clamp-2 leading-relaxed ${!n.is_read ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>
                            {n.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Avatar Góc Phải */}
        <Link href="/profile">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity ml-2">
            <div className="w-12 h-12 bg-gradient-to-tr from-sky-400 to-blue-500 rounded-full p-1 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-2xl overflow-hidden border-2 border-white">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.role === 'teacher' ? '👩‍🏫' : user?.role === 'parent' ? '👨‍👩‍👧' : '🐶'
                )}
              </div>
            </div>
          </div>
        </Link>

      </div>
    </header>
  );
}