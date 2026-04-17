'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getTeacherCoursesService, createCourseService, togglePublishService } from '../services/course.service';
import { getParentChildrenCoursesService } from '../services/course.service';
import { updateCourseService, deleteCourseService, getStudentCoursesService } from '../services/course.service';
// 🎯 ĐÃ IMPORT HÀM TỪ SERVICE VÀO
import { getStudentClassGradesService } from '../services/course.service';

function getUserFromToken(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  } catch (error) {
    return null;
  }
}

export async function getMyCoursesAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, data: [] };

  const user = getUserFromToken(token);
  if (!user || user.role !== 'teacher') return { success: false, data: [] };

  try {
    const courses = await getTeacherCoursesService(user.id);
    return { success: true, data: courses };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function createCourseAction(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user || user.role !== 'teacher') return { success: false, message: 'Chỉ giáo viên mới được tạo khóa học' };

  const schema = z.object({
    name: z.string().min(5, 'Tên khóa học phải dài ít nhất 5 ký tự'),
    code: z.string().min(3, 'Mã khóa học phải từ 3 ký tự trở lên (VD: TOAN01)'),
    description: z.string().optional(),
    theme_color: z.string().optional(),
    thumbnail_url: z.string().optional(),
  });

  const rawData = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(rawData);

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  try {
    await createCourseService(user.id, parsed.data);
    revalidatePath('/courses'); 
    return { success: true, message: '🎉 Khai giảng khóa học mới thành công!' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function togglePublishAction(courseId: number, isPublished: boolean) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user || user.role !== 'teacher') return { success: false, message: 'Không có quyền' };

  try {
    await togglePublishService(courseId, user.id, isPublished);
    revalidatePath('/courses');
    return { success: true, message: isPublished ? '👀 Đã mở cho học sinh xem!' : '🙈 Đã ẩn khóa học!' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getMyChildrenLearningAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, data: [] };

  const user = getUserFromToken(token);
  if (!user || user.role !== 'parent') return { success: false, data: [] };

  try {
    const rawCourses = await getParentChildrenCoursesService(user.id);
    const groupedData: Record<number, any> = {};

    rawCourses.forEach((row) => {
      if (!groupedData[row.student_id]) {
        groupedData[row.student_id] = {
          student_id: row.student_id,
          student_name: row.student_name,
          student_avatar: row.student_avatar,
          courses: [] 
        };
      }
      
      if (row.class_id) {
        groupedData[row.student_id].courses.push({
          class_id: row.class_id,
          class_name: row.class_name,
          course_id: row.course_id,
          course_name: row.course_name,
          thumbnail_url: row.thumbnail_url,
          theme_color: row.theme_color,
          overall_grade: row.overall_grade,
          enrollment_status: row.enrollment_status
        });
      }
    });

    const finalData = Object.values(groupedData);
    return { success: true, data: finalData };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function updateCourseAction(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user || user.role !== 'teacher') return { success: false, message: 'Không có quyền' };

  const courseId = Number(formData.get('course_id'));
  
  const schema = z.object({
    name: z.string().min(5, 'Tên môn học phải dài ít nhất 5 ký tự'),
    code: z.string().min(3, 'Mã môn học phải từ 3 ký tự trở lên'),
    description: z.string().optional(),
    theme_color: z.string().optional(),
    thumbnail_url: z.string().optional(),
  });

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: parsed.error.issues[0].message };

  try {
    await updateCourseService(courseId, user.id, parsed.data);
    revalidatePath('/manage-courses'); 
    return { success: true, message: '✅ Đã lưu thay đổi!' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteCourseAction(courseId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user || user.role !== 'teacher') return { success: false, message: 'Không có quyền' };

  try {
    await deleteCourseService(courseId, user.id);
    revalidatePath('/manage-courses');
    return { success: true, message: '🗑️ Đã xóa môn học!' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getMyLearningAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, data: [] };

  const user = getUserFromToken(token);
  if (!user || user.role !== 'student') return { success: false, data: [] };

  try {
    const courses = await getStudentCoursesService(user.id);
    return { success: true, data: courses };
  } catch (error) {
    console.error(error);
    return { success: false, data: [] };
  }
}

// 🎯 HÀM MỚI: ACTION ĐỂ FRONTEND GỌI LẤY ĐIỂM
export async function getStudentClassGradesAction(studentId: number, classId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? getUserFromToken(token) : null;
  
  if (!user || user.role !== 'parent') return { success: false, data: [] };

  try {
    // Gọi sang Service
    const grades = await getStudentClassGradesService(studentId, classId);
    return { success: true, data: grades };
  } catch (error) {
    console.error(error);
    return { success: false, data: [] };
  }
}