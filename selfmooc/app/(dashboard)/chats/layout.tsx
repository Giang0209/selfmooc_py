import { cookies } from 'next/headers';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import Link from 'next/link';
import { getTeacherChatListService, getParentChatListService } from '@/modules/chats/services/chat.service';
import { UserProvider } from './user-provider'; // 👈 đổi import

export default async function MessagingLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  const payload = JSON.parse(Buffer.from(token!.split('.')[1], 'base64').toString());
  const user = { ...payload, id: payload.id, role: payload.role };
  const isTeacher = user.role === 'teacher';

  const chatList = isTeacher
    ? await getTeacherChatListService(user.id)
    : await getParentChatListService(user.id);

  return (
    <div className="relative z-10 h-full flex gap-6">
      {/* CỘT TRÁI */}
      <div className="w-80 flex flex-col bg-white rounded-[32px] shadow-lg border-4 border-emerald-100 overflow-hidden">
        <div className="p-6 bg-emerald-50 border-b-2 border-emerald-100">
          <h2 className="text-xl font-black text-emerald-800 flex items-center gap-2 uppercase">
            <span>{isTeacher ? '👨‍🏫' : '👨‍👩‍👧'}</span> {isTeacher ? 'Phụ Huynh' : 'Giảng Viên'}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {chatList.map((contact: any) => (
            <Link key={contact.contact_id} href={`/chats/${contact.contact_id}`}>
              <div className="group flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-200 transition-all cursor-pointer shadow-sm">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg shadow-inner">
                  {isTeacher ? '👤' : '🎓'}
                </div>
                <div className="overflow-hidden font-bold">

                  {/* 👇 NAME CHÍNH */}
                  <p className="truncate text-sm text-gray-800">
                    {contact.contact_name}
                  </p>

                  {/* 👇 INFO PHỤ (ROLE CONTEXT) */}
                  <p className="text-[10px] text-emerald-500 truncate mt-0.5">
                    {isTeacher ? (
                      <>👨‍👩‍👧 PH: {contact.sub_info}</>
                    ) : (
                      <>👨‍🏫 GV: {contact.sub_info}</>
                    )}
                  </p>

                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CỘT PHẢI — bọc children trong UserContext.Provider */}
      <div className="flex-1 bg-white rounded-[32px] shadow-lg border-4 border-emerald-100 overflow-hidden relative">
        <UserProvider user={user}>
          {children}
        </UserProvider>
      </div>
    </div>
  );
}