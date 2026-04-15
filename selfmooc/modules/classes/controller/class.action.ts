'use server';

import { cookies } from 'next/headers';
import { getClassesByTeacherDB, createClassDB, removeStudentFromClassDB, getAttendanceListDB } from '../models/class.model';
import { getMyCoursesAction } from '@/modules/courses/controller/course.action'; // Dùng lại action này để lấy list course cho Dropdown

// Hàm giải mã Token (nhớ import hoặc đưa ra file utils dùng chung)
function getUserFromToken(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  } catch (error) {
    return null;
  }
}

export async function getMyClassesListAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, data: [] };

  const user = getUserFromToken(token);
  if (!user || user.role !== 'teacher') return { success: false, data: [] };

  try {
    const classes = await getClassesByTeacherDB(user.id);
    return { success: true, data: classes };
  } catch (error) {
    console.error(error);
    return { success: false, data: [] };
  }
}

export async function createNewClassAction(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user || user.role !== 'teacher') return { success: false, message: 'Không có quyền' };

  try {
    const payload = {
      course_id: Number(formData.get('course_id')),
      teacher_id: user.id,
      name: formData.get('name') as string,
      academic_year: formData.get('academic_year') as string,
      semester: Number(formData.get('semester')),
      max_students: Number(formData.get('max_students')),
    };

    if (!payload.course_id || !payload.name) {
      return { success: false, message: 'Vui lòng điền đủ thông tin bắt buộc!' };
    }

    await createClassDB(payload);
    return { success: true, message: '🎉 Tạo lớp học thành công!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Lỗi hệ thống khi tạo lớp' };
  }
}

export async function removeStudentAction(classId: number, studentId: number) {
  try {
    await removeStudentFromClassDB(classId, studentId);
    return { success: true, message: 'Đã xóa học sinh khỏi lớp!' };
  } catch (error: any) {
    return { success: false, message: 'Lỗi khi xóa học sinh' };
  }
}

import { getClassStudentsDB, enrollStudentByCodeDB } from '../models/class.model';

// Lấy danh sách học sinh của lớp
export async function getClassStudentsAction(classId: number) {
  try {
    const students = await getClassStudentsDB(classId);
    return { success: true, data: students };
  } catch (error) {
    return { success: false, data: [] };
  }
}

// Thêm học sinh vào lớp
export async function addStudentToClassAction(formData: FormData) {
  const classId = Number(formData.get('class_id'));
  const studentCode = formData.get('student_code') as string;

  if (!studentCode) return { success: false, message: 'Vui lòng nhập mã học sinh' };

  try {
    const studentName = await enrollStudentByCodeDB(classId, studentCode.trim().toUpperCase());
    return { success: true, message: `🎉 Đã thêm học sinh ${studentName} vào lớp!` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

import { getClassAndCourseDocumentsDB } from '../models/class.model';
import { getMongoDb } from '@/lib/db'; // Nhớ check lại đường dẫn file kết nối DB của bạn

// Lấy danh sách Học liệu hiển thị ra Tab 4
export async function getClassMaterialsAction(classId: number) {
  try {
    // 1. Lấy thông tin cơ bản từ Postgres
    const pgDocs = await getClassAndCourseDocumentsDB(classId);
    if (pgDocs.length === 0) return { success: true, data: [] };

    // 2. Sang Mongo lấy Link URL dựa vào pg_document_id
    const pgDocIds = pgDocs.map(d => d.document_id);
    const db = await getMongoDb();
    const mongoDocs = await db.collection('document_content')
      .find({ pg_document_id: { $in: pgDocIds } })
      .toArray();

    // 3. Hợp nhất dữ liệu
    const mergedDocs = pgDocs.map(pgDoc => {
      const mongoDoc = mongoDocs.find(m => m.pg_document_id === pgDoc.document_id);
      return {
        ...pgDoc,
        storage_url: mongoDoc?.storage_url || '#'
      };
    });

    return { success: true, data: mergedDocs };
  } catch (error) {
    console.error(error);
    return { success: false, data: [] };
  }
}

import { saveBulkAttendanceDB, getAttendanceHistoryDB } from '../models/class.model';

export async function getClassAttendanceAction(classId: number) {
  try {
    const data = await getAttendanceListDB(classId);
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, data: [] };
  }
}

// Action: Xử lý nút Submit Lưu điểm danh
export async function saveBulkAttendanceAction(classId: number, records: { student_id: number, status: string }[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? getUserFromToken(token) : null;
  if (!user || user.role !== 'teacher') return { success: false, message: 'Không có quyền' };

  try {
    await saveBulkAttendanceDB(classId, user.id, records);
    return { success: true, message: '✅ Đã lưu điểm danh thành công!' };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: 'Lỗi hệ thống khi lưu điểm danh' };
  }
}

// Action: Lấy lịch sử điểm danh và nhóm theo ngày
export async function getAttendanceHistoryAction(classId: number) {
  try {
    const rawData = await getAttendanceHistoryDB(classId);

    // Thuật toán Gom nhóm dữ liệu theo ngày (session_date)
    const groupedData: Record<string, any[]> = {};
    
    rawData.forEach(row => {
      // Chuyển đổi định dạng ngày thành chuỗi DD/MM/YYYY
      const dateStr = new Date(row.session_date).toLocaleDateString('vi-VN');
      
      if (!groupedData[dateStr]) {
        groupedData[dateStr] = [];
      }
      groupedData[dateStr].push(row);
    });

    // Chuyển Object thành mảng Array để UI dễ render
    const formattedData = Object.keys(groupedData).map(date => ({
      date,
      records: groupedData[date]
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    return { success: false, data: [] };
  }
}