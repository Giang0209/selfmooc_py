import { cookies } from 'next/headers';
import { redirect } from 'next/navigation'; // Thêm cái này để đá văng người chưa đăng nhập
import Sidebar from '../../components/layout/Sidebar'; // Check lại đường dẫn
import Header from '../../components/layout/Header'; // 🎯 IMPORT THÊM HEADER Ở ĐÂY

// Sửa lại hàm: Lấy toàn bộ User thay vì chỉ lấy Role
function getUserFromToken(token: string) {
  try {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded); // Trả về cả { id, role, name, avatar_url... }
  } catch (error) {
    return null;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 1. Lấy Token từ Cookie
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  // 2. Bảo vệ cổng: Không có token -> Bay ra trang Login
  if (!token) {
    redirect('/login');
  }

  const user = getUserFromToken(token);
  
  // Giải mã lỗi (token rởm) -> Bay ra trang Login
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-sky-50 overflow-hidden">
      
      {/* 1. SIDEBAR CỦA CHÚNG TA ĐÂY NÀY */}
      <Sidebar role={user.role} />

      {/* CỘT BÊN PHẢI - Header & Nội dung chính */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* 2. HEADER XỊN SÒ ĐÃ ĐƯỢC LẮP VÀO ĐÂY (Thay cho cục hardcode cũ) 🚀 */}
        <Header user={user} />

        {/* 3. KHU VỰC NỘI DUNG CHÍNH (Nơi trang Profile, Family... sẽ được nhúng vào) */}
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