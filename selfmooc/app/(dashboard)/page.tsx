import { cookies } from 'next/headers';
import Sidebar from '../components/layout/Sidebar';
import Link from 'next/dist/client/link';

// Hàm nhỏ xíu để giải mã JWT lấy Role mà không cần cài thêm thư viện
function getRoleFromToken(token: string) {
  try {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded).role as 'student' | 'teacher' | 'parent';
  } catch (error) {
    return 'student'; // Mặc định nếu lỗi
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 1. Lấy Cookie từ Server
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  
  // 2. Lấy Role từ Token
  const role = token ? getRoleFromToken(token) : 'student';

  return (
    <div className="flex h-screen bg-sky-50 overflow-hidden">
      
      {/* 3. Truyền Role xuống cho Sidebar */}
      <Sidebar role={role} />

      {/* CỘT BÊN PHẢI - Header & Nội dung chính */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b-4 border-sky-100 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h2 className="text-xl font-bold text-gray-700">Xin chào, nhà thám hiểm!</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="w-12 h-12 flex items-center justify-center bg-yellow-100 text-yellow-600 rounded-full text-2xl hover:scale-110 transition-transform shadow-sm">
              🔔
            </button>
            <Link href="/profile">
              <div className="flex items-center gap-3 bg-purple-100 py-2 px-4 rounded-full cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
                <div className="w-10 h-10 bg-purple-300 rounded-full flex items-center justify-center text-xl shadow-inner">
                  {role === 'teacher' ? '👩‍🏫' : role === 'parent' ? '👨‍👩‍👧' : '🐶'}
                </div>
                <span className="font-bold text-purple-700 hidden sm:block">Hồ sơ</span>
              </div>
            </Link>
          </div>
        </header>

        {/* KHU VỰC NỘI DUNG CHÍNH */}
        <main className="flex-1 overflow-y-auto p-8 relative">
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
           <div className="relative z-10">
              {children}
           </div>
        </main>

      </div>
    </div>
  );
}