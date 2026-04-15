import { cookies } from 'next/headers';
import TeacherClassesPage from './TeacherClassesPage'; 
import StudentClassesPage from './StudentClassesPage'; 

function getUserFromToken(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  } catch (error) {
    return null;
  }
}

export default async function ClassesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return <div>Vui lòng đăng nhập...</div>;

  const user = getUserFromToken(token);

  // Ở ĐÂY KHÔNG TRUYỀN PARAMS VÌ ĐÂY LÀ TRANG DANH SÁCH TỔNG
  if (user?.role === 'teacher') {
    return <TeacherClassesPage />; 
  }

  if (user?.role === 'student') {
    return <StudentClassesPage />;
  }

  return <div>Không có quyền truy cập</div>;
}