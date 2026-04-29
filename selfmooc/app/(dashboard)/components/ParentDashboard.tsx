'use client';

import { useEffect, useState } from 'react';
import { getDashboardStatsAction } from '@/modules/classes/controller/dashboard.action';
import { getMyNotificationsAction } from '@/modules/notifications/notification.action';

export default function ParentDashboard() {
    const [childrenStats, setChildrenStats] = useState<any[]>([]);

    useEffect(() => {
        async function fetchData() {
            const res = await getDashboardStatsAction();
            if (res.success && Array.isArray(res.data)) {
                setChildrenStats(res.data);
            }
        }
        fetchData();
    }, []);

    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        async function fetchNoti() {
            const res = await getMyNotificationsAction();
            if (res.success) {
                setNotifications(res.data.slice(0, 3)); // 👈 chỉ lấy 3 cái mới nhất
            }
        }
        fetchNoti();
    }, []);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 gap-8">
                {childrenStats.length > 0 ? (
                    childrenStats.map((child, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-[3rem] shadow-xl border-b-8 border-indigo-100 overflow-hidden relative">
                            {/* Trang trí nền */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-20 -mt-20 z-0 opacity-50"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
                                        {child.student_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-gray-800">Học sinh: {child.student_name}</h3>
                                        <p className="text-indigo-600 font-bold tracking-wide">Lớp: {child.class_name || 'Đã phân lớp'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-green-50 p-6 rounded-3xl border-2 border-green-100">
                                        <p className="text-green-600 font-bold uppercase text-xs mb-1">Điểm trung bình</p>

                                        <h4 className="text-4xl font-black text-green-700">
                                            {Number(child.avg_grade).toFixed(1)}
                                        </h4>

                                        <p className="text-sm mt-2 font-medium">
                                            {child.academic_status === 'excellent' && '🔥 Đang học tập rất tốt'}
                                            {child.academic_status === 'good' && '📈 Ổn định'}
                                            {child.academic_status === 'weak' && '⚠️ Cần cố gắng'}
                                        </p>
                                    </div>

                                    <div className="bg-rose-50 p-6 rounded-3xl border-2 border-rose-100">
                                        <p className="text-rose-600 font-bold uppercase text-xs mb-1">Số buổi nghỉ</p>

                                        <h4 className="text-4xl font-black text-rose-700">
                                            {child.absences || 0}
                                        </h4>

                                        <p className={`text-sm mt-2 font-medium`}>
                                            {child.attendance_status === 'ok'
                                                ? '✅ Chuyên cần ổn định'
                                                : '⚠️ Cần theo dõi chuyên cần'
                                            }
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100">
                                        <p className="text-blue-600 font-bold uppercase text-xs mb-1">Tin nhắn mới</p>
                                        <h4 className="text-4xl font-black text-blue-700">0</h4>
                                        <button className="text-blue-500 text-sm mt-2 font-bold hover:underline">📩 Nhắn tin cho GV</button>
                                    </div>

                                    {/* 👇 THÔNG BÁO ĐÚNG CHỖ */}
                                    {(child.academic_status === 'weak' || child.attendance_status !== 'ok') && (
                                        <div className="mt-6 p-4 rounded-2xl bg-yellow-50 border border-yellow-200">
                                            <p className="font-bold text-yellow-700">
                                                ⚠️ Thông báo từ hệ thống
                                            </p>

                                            <p className="text-sm text-yellow-600 mt-1">
                                                {child.academic_status === 'weak' && 'Học lực đang dưới mức trung bình. Cần theo dõi sát.'}
                                                {child.attendance_status !== 'ok' && 'Chuyên cần chưa ổn định (vắng nhiều buổi).'}
                                            </p>

                                            {child.need_notify && (
                                                <p className="text-xs text-red-500 mt-2 font-bold">
                                                    📩 Khuyến nghị: liên hệ giáo viên để trao đổi
                                                </p>
                                            )}
                                        </div>
                                    )}

                                </div>

                                <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-100 flex flex-wrap gap-4">
                                    <a href={`/schedule?studentId=${child.student_id}`} className="px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all">
                                        Xem lịch học của con
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border-4 border-dashed border-gray-100">
                        <span className="text-6xl mb-6 block">👨‍👩‍👧‍👦</span>
                        <p className="text-2xl font-black text-gray-400">Bạn chưa liên kết tài khoản với con em mình.</p>
                        <button className="mt-6 px-8 py-4 bg-indigo-500 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all shadow-lg">
                            Liên Kết Ngay
                        </button>
                    </div>
                )}

                {/* 🔔 BLOCK THÔNG BÁO */}
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border-b-8 border-sky-100">
                    <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                        <span>🔔 Thông báo mới nhất</span>
                    </h3>

                    {notifications.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 font-bold">
                            <span className="text-4xl block mb-2">📭</span>
                            Chưa có thông báo
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map(n => (
                                <div
                                    key={n._id}
                                    className={`p-5 rounded-2xl border transition-all ${!n.is_read
                                        ? 'bg-sky-50 border-sky-200'
                                        : 'bg-gray-50 border-gray-100'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <p className={`font-bold ${!n.is_read ? 'text-gray-800' : 'text-gray-500'}`}>
                                            {n.title}
                                        </p>

                                        {!n.is_read && (
                                            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full mt-1.5"></span>
                                        )}
                                    </div>

                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {n.body}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
