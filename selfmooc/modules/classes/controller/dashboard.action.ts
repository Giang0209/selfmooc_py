'use server';

import { cookies } from 'next/headers';
import { pgPool } from '@/lib/db';

function getUserFromToken(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
  } catch (error) { return null; }
}

export async function getDashboardStatsAction() {
  const token = (await cookies()).get('session')?.value;
  const user = token ? getUserFromToken(token) : null;
  if (!user) return { success: false, data: null };

  const client = await pgPool.connect();
  try {
    if (user.role === 'teacher') {
      const stats = await client.query(`
        SELECT 
          (SELECT count(*) FROM class WHERE teacher_id = $1) as total_classes,
          (SELECT count(DISTINCT student_id) FROM enrollment e JOIN class c ON e.class_id = c.class_id WHERE c.teacher_id = $1) as total_students,
          (SELECT count(*) FROM submission s JOIN assignment a ON s.assignment_id = a.assignment_id JOIN class c ON a.class_id = c.class_id WHERE c.teacher_id = $1 AND s.status = 'submitted') as pending_grades
      `, [user.id]);
      return { success: true, data: stats.rows[0] };
    }

    if (user.role === 'student') {
      const stats = await client.query(`
        SELECT 
          COALESCE(avg(grade), 0) as avg_grade,
          count(*) filter (where status = 'graded') as completed_tasks,
          (SELECT count(*) FROM assignment a JOIN enrollment e ON a.class_id = e.class_id WHERE e.student_id = $1) as total_tasks
        FROM submission 
        WHERE student_id = $1
      `, [user.id]);
      return { success: true, data: stats.rows[0] };
    }

    if (user.role === 'parent') {
      const stats = await client.query(`
        SELECT 
            s.student_id,
            s.name as student_name,

            -- 🎯 điểm trung bình
            COALESCE(AVG(sub.grade), 0) as avg_grade,

            -- 🎯 số buổi nghỉ
            COALESCE((
                SELECT COUNT(*) 
                FROM attendance 
                WHERE student_id = s.student_id 
                AND status = 'absent'
            ), 0) as absences,

            -- 🎯 xếp loại học tập
            CASE 
                WHEN COALESCE(AVG(sub.grade), 0) >= 8 THEN 'excellent'
                WHEN COALESCE(AVG(sub.grade), 0) >= 5 THEN 'good'
                ELSE 'weak'
            END as academic_status,

            -- 🎯 trạng thái chuyên cần
            CASE 
                WHEN (
                    SELECT COUNT(*) 
                    FROM attendance 
                    WHERE student_id = s.student_id 
                    AND status = 'absent'
                ) > 2 
                THEN 'warning'
                ELSE 'ok'
            END as attendance_status,

            -- 🎯 có cần gửi thông báo không
            CASE 
                WHEN (
                    SELECT COUNT(*) 
                    FROM attendance 
                    WHERE student_id = s.student_id 
                    AND status = 'absent'
                ) > 2 
                OR COALESCE(AVG(sub.grade), 0) < 5
                THEN true
                ELSE false
            END as need_notify

        FROM parent_student ps
        JOIN student s ON ps.student_id = s.student_id
        LEFT JOIN submission sub 
            ON s.student_id = sub.student_id 
            AND sub.status = 'graded'
        WHERE ps.parent_id = $1
        GROUP BY s.student_id, s.name
    `, [user.id]);

      return { success: true, data: stats.rows };
    }
    return { success: false, message: 'Role không hợp lệ' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Lỗi lấy thống kê dashboard' };
  } finally {
    client.release();
  }
}

export async function getScheduleDisplayInfoAction(studentId?: number) {
  const token = (await cookies()).get('session')?.value;
  const user = token ? getUserFromToken(token) : null;
  if (!user) return { success: false, data: null };

  const client = await pgPool.connect();
  try {
    const targetStudentId = (user.role === 'parent' && studentId) ? studentId : user.id;

    if (user.role === 'student' || (user.role === 'parent' && studentId)) {
      // Tìm tên lớp và tên sinh viên
      const res = await client.query(`
        SELECT c.name as class_name, s.name as student_name
        FROM student s
        LEFT JOIN enrollment e ON s.student_id = e.student_id
        LEFT JOIN class c ON e.class_id = c.class_id
        WHERE s.student_id = $1
        LIMIT 1
      `, [targetStudentId]);

      return {
        success: true,
        data: {
          className: res.rows[0]?.class_name || 'Chưa phân lớp',
          studentName: res.rows[0]?.student_name,
          role: user.role,
          viewingAsChild: user.role === 'parent'
        }
      };
    }

    if (user.role === 'teacher') {
      return { success: true, data: { role: 'teacher' } };
    }

    return { success: true, data: { role: user.role } };
  } catch (error) {
    return { success: false, message: 'Lỗi lấy thông tin hiển thị' };
  } finally {
    client.release();
  }
}
