'use client';

import { useState, useEffect, useRef, use } from 'react';
import { io } from 'socket.io-client';
import { sendMessageAction, getChatDetailsAction } from '@/modules/chats/controller/chat.action';
import { useUser } from '../user-provider'; // 👈 THÊM

let socket: any;

interface ChatParams {
  contactId: string;
}

export default function DetailChatPage({ params }: { params: Promise<ChatParams> }) {
  const user = useUser(); // 👈 Lấy user từ context, bỏ props user
  const unwrappedParams = use(params);
  const contactId = unwrappedParams.contactId;

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [contact, setContact] = useState<any>(null);

  useEffect(() => {
    console.log('=== USER FROM CONTEXT ===', user);

    async function initChat() {
      console.log('initChat running with:', { contactId, user });

      const tId = user.role === 'teacher'
        ? Number(user.id)
        : Number(contactId);

      const pId = user.role === 'parent'
        ? Number(user.id)
        : Number(contactId);

      const res = await getChatDetailsAction(Number(tId), Number(pId), 1, user.role);
      console.log('getChatDetailsAction result:', res);

      if (res.success) {
        setCurrentConvId(res.convId ?? null);
        setMessages(res.history ?? []);
        setContact(res.contactInfo);
      }
    }

    if (user) initChat();
  }, [contactId, user]);

  useEffect(() => {
    if (!currentConvId) return;
    socket = io('http://localhost:3001');
    socket.emit('join_conversation', currentConvId);

    socket.on('receive_message', (data: any) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => socket.disconnect();
  }, [currentConvId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    // 🎯 KIỂM TRA SOCKET TRƯỚC KHI DÙNG
    if (!input.trim() || !currentConvId || !socket) {
      console.warn("Chưa có kết nối socket hoặc nội dung trống!");
      return;
    }

    const payload = {
      tId: user?.role === 'teacher' ? Number(user.id) : Number(contactId),
      pId: user?.role === 'parent' ? Number(user.id) : Number(contactId),
      sId: 1,
      content: input,
      senderRole: user?.role,
      conversationId: currentConvId,
      sender_id: user?.id,
      created_at: new Date().toISOString()
    };

    try {
      // 1. Phát tin qua Socket (Real-time) - Bây giờ đã an toàn
      socket.emit('send_message', payload);

      // 2. Lưu vào MongoDB qua Server Action (Chạy ngầm)
      await sendMessageAction(payload);

      setInput('');
    } catch (err) {
      console.error("Gửi tin nhắn thất bại:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-inherit">
      <div className="p-5 border-b-2 border-emerald-50 bg-white/90 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl shadow-md">
          {contact?.name?.charAt(0) || '👤'}
        </div>

        <div>
          <h3 className="text-lg font-black text-gray-800">
            {contact?.name || 'Đang tải...'}
          </h3>

          {contact?.role && (
            <p className="text-xs text-emerald-500 font-bold">
              {contact.role === 'parent' ? '👨‍👩‍👧 Phụ huynh' : '👨‍🏫 Giáo viên'}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar">
        {messages.map((m, index) => (
          <div key={index} className={`flex ${Number(m.sender_id) === Number(user?.id) ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-4 rounded-3xl shadow-sm text-sm font-bold ${Number(m.sender_id) === Number(user?.id)
              ? 'bg-emerald-500 text-white rounded-tr-none'
              : 'bg-white text-gray-700 border-2 border-emerald-50 rounded-tl-none'
              }`}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="p-6 bg-white border-t-4 border-emerald-50">
        <div className="flex gap-3 bg-gray-50 p-2 rounded-2xl border-2 focus-within:border-emerald-400 focus-within:bg-white transition-all shadow-inner">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhập lời nhắn..."
            className="flex-1 bg-transparent px-4 py-2 outline-none font-bold text-sm"
          />
          <button onClick={handleSend} className="px-6 py-2 bg-emerald-500 text-white font-black rounded-xl shadow-[0_4px_0_rgb(5,150,105)] active:scale-95 transition-all">
            GỬI 🚀
          </button>
        </div>
      </div>
    </div>
  );
}