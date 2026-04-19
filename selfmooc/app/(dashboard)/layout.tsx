import { cookies } from 'next/headers';
import { redirect } from 'next/navigation'; // Import cái này để đá văng khách không mời
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

// 🎯 HÀM MỚI: Trả về TOÀN BỘ thông tin user thay vì chỉ mỗi cái role
function getUserFromToken(token: string) {
  try {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded); // Trả về cục { id, role, name, avatar_url... }
  } catch (error) {
    return null; 
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 1. Lấy Cookie từ Server
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  
  // 2. Bảo vệ cửa: Không có token -> Bay ra trang Login
  if (!token) {
    redirect('/login');
  }

  // 3. Lấy toàn bộ thông tin User từ Token
  const user = getUserFromToken(token);

  // Nếu token rởm/lỗi -> Bay ra trang Login
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-sky-50 overflow-hidden">
      
      {/* 4. Truyền đúng cái ROLE xuống cho Sidebar */}
      <Sidebar role={user.role} />

      {/* CỘT BÊN PHẢI - Header & Nội dung chính */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* 5. Truyền TOÀN BỘ cục user vào cho Header để nó lấy tên, avatar */}
        <Header user={user} />

        {/* KHU VỰC NỘI DUNG CHÍNH */}
        <main className="flex-1 overflow-y-auto p-8 relative">
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
           <div className="relative z-10 h-full">
              {children}
           </div>
        </main>

      </div>
    </div>
  );
}