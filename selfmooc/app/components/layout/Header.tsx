'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getMyNotificationsAction, markAsReadAction } from '@/modules/notifications/notification.action';


// Truyền thông tin user vào để hiện lời chào (tên, avatar...)
export default function Header({ user }: { user?: any }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const [selectedNotif, setSelectedNotif] = useState<any>(null);

  useEffect(() => {
    // Gọi API lấy thông báo khi render
    if (user) {
      getMyNotificationsAction().then(res => {
        if (res.success) setNotifications(res.data);
      });
    }
  }, [user]);

  // Hàm tạo lời chào theo buổi trong ngày cho thân thiện
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const handleNotifClick = async (notif: any) => {
    setSelectedNotif(notif);
    if (!notif.is_read) {
      await markAsReadAction(notif._id); // Gọi API đánh dấu đã đọc
      // Cập nhật lại UI ngay lập tức
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, is_read: true } : n));
    }
  };

  return (
    <>

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

        {/* CỘT PHẢI: Tìm kiếm, Thông báo & Avatar */}
        <div className="flex items-center gap-6">

          {/* Thanh tìm kiếm (Giả lập) */}
          <div className="hidden md:flex items-center bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-2 focus-within:border-blue-400 focus-within:bg-white transition-all">
            <span className="text-gray-400 mr-2">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm bài học..."
              className="bg-transparent border-none focus:outline-none text-sm font-medium w-48"
            />
          </div>

          {/* NÚT THÔNG BÁO VỚI DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 bg-slate-800 text-amber-500 rounded-xl hover:bg-slate-700 hover:-translate-y-1 transition-all border border-slate-700"
            >
              <span className="text-xl drop-shadow-sm">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-slate-800 rounded-full animate-pulse flex items-center justify-center text-[8px] text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* BOX DROPDOWN THÔNG BÁO */}
            {showNotifs && (
              // 🎯 FIX 2: Tăng chiều rộng lên w-[420px], thêm viền tinh tế và shadow đậm hơn
              <div className="absolute right-0 mt-4 w-[420px] bg-slate-800 border border-slate-700 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-fade-in-down">

                <div className="p-5 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                  <h3 className="text-lg font-black text-white whitespace-nowrap">Thông báo</h3>
                  <span className="text-xs bg-sky-500/20 text-sky-400 px-3 py-1 rounded-lg font-bold">{unreadCount} mới</span>
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center text-slate-500 text-sm font-medium">Chưa có thông báo nào</div>
                  ) : (
                    <div className="divide-y divide-slate-700/50">
                      {notifications.map(n => (
                        <div
                          key={n._id}
                          onClick={() => handleNotifClick(n)}
                          // 🎯 Giao diện cho thông báo chưa đọc / đã đọc
                          className={`p-5 hover:bg-slate-700/50 cursor-pointer transition-colors ${!n.is_read ? 'bg-sky-500/10' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className={`text-base pr-4 ${!n.is_read ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                              {n.title}
                            </h4>
                            {!n.is_read && (
                              <div className="w-2.5 h-2.5 bg-rose-500 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{n.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Avatar Góc Phải (Bấm vào cũng ra trang Profile) */}
          <Link href="/profile">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-gradient-to-tr from-purple-400 to-blue-400 rounded-full p-1 shadow-md">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-2xl overflow-hidden">
                  {/* 🎯 LOGIC AVATAR THÔNG MINH Ở ĐÂY */}
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
      {selectedNotif && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]"
          onClick={() => setSelectedNotif(null)}
        >
          <div
            className="bg-white w-[500px] rounded-2xl shadow-xl p-6 relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Nút đóng */}
            <button
              onClick={() => setSelectedNotif(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-black"
            >
              ✖
            </button>

            {/* Nội dung */}
            <h2 className="text-xl font-bold mb-3">
              {selectedNotif.title}
            </h2>

            <p className="text-gray-600 leading-relaxed">
              {selectedNotif.body}
            </p>

            <div className="mt-4 text-sm text-gray-400">
              {selectedNotif.is_read ? "Đã đọc" : "Chưa đọc"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}