export default function MessagesDefaultPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-fade-in">
      <div className="relative">
        <div className="text-9xl mb-6 animate-bounce">💬</div>
        <div className="absolute -top-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white font-bold animate-pulse">
          !
        </div>
      </div>
      
      <h2 className="text-3xl font-black text-gray-800 italic">"Kết nối Nhà trường & Gia đình"</h2>
      <p className="text-gray-500 mt-4 font-bold max-w-sm leading-relaxed">
        Chọn một người liên lạc ở danh sách bên trái để bắt đầu trao đổi về hành trình thám hiểm của các bạn nhỏ nhé! 🚀
      </p>
      
      <div className="mt-10 flex gap-4">
        <div className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-xs uppercase shadow-sm border border-emerald-100">
          🤝 Đồng hành
        </div>
        <div className="px-5 py-2 bg-sky-50 text-sky-600 rounded-xl font-black text-xs uppercase shadow-sm border border-sky-100">
          📊 Tiến độ
        </div>
      </div>
    </div>
  );
}