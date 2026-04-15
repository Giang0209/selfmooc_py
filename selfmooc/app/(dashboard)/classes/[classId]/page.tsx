import { cookies } from 'next/headers';
import TeacherClassDetailPage from './TeacherClassDetailPage';
import StudentClassDetailPage from './StudentClassDetailPage';

function getUserFromToken(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  } catch (error) {
    return null;
  }
}

export default async function ClassDetailRouterPage({ params }: { params: Promise<{ classId: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return <div>Vui lòng đăng nhập...</div>;

  const user = getUserFromToken(token);
  
  // Lấy classId để truyền cho Học sinh
  const resolvedParams = await params;
  const classId = parseInt(resolvedParams.classId);

  // 🎯 NẾU LÀ GIÁO VIÊN -> Gọi file chi tiết bạn vừa gửi và TRUYỀN PARAMS VÀO
  if (user?.role === 'teacher') {
    return <TeacherClassDetailPage params={params} />;
  }

  // NẾU LÀ HỌC SINH
  if (user?.role === 'student') {
    return <StudentClassDetailPage classId={classId} />;
  }

  return <div>Không có quyền truy cập</div>;
}