import { getCoursesByTeacherDB, createCourseDB, toggleCoursePublishDB } from '../models/course.model';
import { getStudentCoursesDB, getParentChildrenCoursesDB } from '../models/course.model';
import { updateCourseDB, deleteCourseDB } from '../models/course.model';
// 🎯 ĐÃ IMPORT HÀM LẤY ĐIỂM TỪ MODEL
import { getStudentClassGradesDB } from '../models/course.model'; 

export async function getTeacherCoursesService(teacherId: number) {
  return await getCoursesByTeacherDB(teacherId);
}

export async function createCourseService(teacherId: number, data: any) {
  try {
    const newCourse = await createCourseDB({ ...data, created_by: teacherId });
    return newCourse;
  } catch (error: any) {
    if (error.code === '23505') {
      throw new Error('❌ Mã khóa học này đã tồn tại! Vui lòng chọn mã khác.');
    }
    throw new Error('Lỗi hệ thống khi tạo khóa học');
  }
}

export async function togglePublishService(courseId: number, teacherId: number, isPublished: boolean) {
  const success = await toggleCoursePublishDB(courseId, teacherId, isPublished);
  if (!success) {
    throw new Error('Không thể cập nhật. Khóa học này không tồn tại hoặc không phải của bạn!');
  }
  return success;
}

export async function getParentChildrenCoursesService(parentId: number) {
  return await getParentChildrenCoursesDB(parentId);
}

export async function updateCourseService(courseId: number, teacherId: number, data: any) {
  try {
    const success = await updateCourseDB(courseId, teacherId, data);
    if (!success) throw new Error('Không tìm thấy môn học hoặc bạn không có quyền sửa!');
    return success;
  } catch (error: any) {
    if (error.code === '23505') throw new Error('❌ Mã môn học này đã bị trùng!');
    throw new Error('Lỗi hệ thống khi cập nhật');
  }
}

export async function deleteCourseService(courseId: number, teacherId: number) {
  const success = await deleteCourseDB(courseId, teacherId);
  if (!success) throw new Error('Không thể xóa môn học này!');
  return success;
}

export async function getStudentCoursesService(studentId: number) {
  return await getStudentCoursesDB(studentId);
}

export async function getStudentClassGradesService(studentId: number, classId: number) {
  return await getStudentClassGradesDB(studentId, classId);
}