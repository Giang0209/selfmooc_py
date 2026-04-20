import { cookies } from 'next/headers';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import ParentDashboard from './components/ParentDashboard';

function getUserFromToken(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
  } catch (error) { return null; }
}

export default async function DashboardPage() {
  const token = (await cookies()).get('session')?.value;
  const user = token ? getUserFromToken(token) : null;

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-gray-800">
          Chào mừng quay trở lại, <span className="text-blue-600">{user.name}</span>! 👋
        </h1>
        <p className="text-gray-500">Đây là tóm tắt hoạt động của bạn trong ngày hôm nay.</p>
      </div>

      {user.role === 'teacher' && <TeacherDashboard />}
      {user.role === 'student' && <StudentDashboard />}
      {user.role === 'parent' && <ParentDashboard />}
    </div>
  );
}