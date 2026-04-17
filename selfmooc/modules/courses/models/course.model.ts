import { pgPool } from '@/lib/db';

// 1. Lấy danh sách khóa học của MỘT giáo viên
export async function getCoursesByTeacherDB(teacherId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT course_id, name, code, description, thumbnail_url, theme_color, is_published, created_at 
      FROM course 
      WHERE created_by = $1 
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [teacherId]);
    return result.rows;
  } finally {
    client.release();
  }
}
// Lấy danh sách Lớp/Khóa học mà HỌC SINH đã ghi danh
export async function getStudentCoursesDB(studentId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT 
        cl.class_id, cl.name AS class_name, cl.academic_year,
        c.course_id, c.name AS course_name, c.code, c.thumbnail_url, c.theme_color,
        e.status AS enrollment_status, e.overall_grade
      FROM enrollment e
      JOIN class cl ON e.class_id = cl.class_id
      JOIN course c ON cl.course_id = c.course_id
      WHERE e.student_id = $1 AND c.is_published = TRUE
      ORDER BY e.enrolled_at DESC
    `;
    const result = await client.query(query, [studentId]);
    return result.rows;
  } finally {
    client.release();
  }
}
// Lấy danh sách Lớp/Khóa học của TẤT CẢ CÁC CON (Dành cho Phụ huynh)
export async function getParentChildrenCoursesDB(parentId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT 
        s.student_id, s.name AS student_name, s.avatar_url AS student_avatar,
        cl.class_id, cl.name AS class_name,
        c.course_id, c.name AS course_name, c.thumbnail_url, c.theme_color,
        e.overall_grade, e.status AS enrollment_status
      FROM parent_student ps
      JOIN student s ON ps.student_id = s.student_id
      -- 🎯 SỬA LẠI THÀNH LEFT JOIN Ở 3 DÒNG DƯỚI NÀY:
      LEFT JOIN enrollment e ON s.student_id = e.student_id
      LEFT JOIN class cl ON e.class_id = cl.class_id
      LEFT JOIN course c ON cl.course_id = c.course_id AND c.is_published = TRUE
      -- 🎯 ĐƯA ĐIỀU KIỆN is_published LÊN TRÊN, ĐỂ DƯỚI WHERE CHỈ CÒN ĐÚNG DÒNG NÀY:
      WHERE ps.parent_id = $1
      ORDER BY s.student_id, e.enrolled_at DESC
    `;
    const result = await client.query(query, [parentId]);
    return result.rows;
  } finally {
    client.release();
  }
}

// 2. Tạo khóa học mới
export async function createCourseDB(data: {
  name: string;
  code: string;
  description: string;
  created_by: number;
  thumbnail_url?: string;
  theme_color?: string;
}) {
  const client = await pgPool.connect();
  try {
    const query = `
      INSERT INTO course (name, code, description, created_by, thumbnail_url, theme_color) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING course_id, name, code
    `;
    const values = [
      data.name, 
      data.code, 
      data.description, 
      data.created_by, 
      data.thumbnail_url || null, 
      data.theme_color || '#3B82F6' // Mặc định màu xanh blue nếu không chọn
    ];
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

// 3. Bật/Tắt trạng thái xuất bản (Publish)
export async function toggleCoursePublishDB(courseId: number, teacherId: number, isPublished: boolean) {
  const client = await pgPool.connect();
  try {
    // Phải check thêm created_by = teacherId để đề phòng ông giáo viên này sửa khóa học của ông giáo viên khác
    const query = `
      UPDATE course SET is_published = $1, updated_at = NOW() 
      WHERE course_id = $2 AND created_by = $3
      RETURNING course_id
    `;
    const result = await client.query(query, [isPublished, courseId, teacherId]);
    return result.rowCount ? result.rowCount > 0 : false;
  } finally {
    client.release();
  }
}
// 4. Cập nhật khóa học
export async function updateCourseDB(courseId: number, teacherId: number, data: any) {
  const client = await pgPool.connect();
  try {
    const query = `
      UPDATE course 
      SET name = $1, code = $2, description = $3, thumbnail_url = $4, theme_color = $5, updated_at = NOW()
      WHERE course_id = $6 AND created_by = $7
    `;
    const values = [data.name, data.code, data.description, data.thumbnail_url, data.theme_color, courseId, teacherId];
    const result = await client.query(query, values);
    return result.rowCount ? result.rowCount > 0 : false;
  } finally {
    client.release();
  }
}

// 5. Xóa khóa học
export async function deleteCourseDB(courseId: number, teacherId: number) {
  const client = await pgPool.connect();
  try {
    const query = `DELETE FROM course WHERE course_id = $1 AND created_by = $2`;
    const result = await client.query(query, [courseId, teacherId]);
    return result.rowCount ? result.rowCount > 0 : false;
  } finally {
    client.release();
  }
}

export async function getStudentClassGradesDB(studentId: number, classId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT a.title, a.assignment_type, s.grade, s.status, s.submitted_at
      FROM assignment a
      LEFT JOIN submission s ON a.assignment_id = s.assignment_id AND s.student_id = $1
      WHERE a.class_id = $2
      ORDER BY a.created_at DESC
    `;
    const result = await client.query(query, [studentId, classId]);
    return result.rows;
  } finally {
    client.release();
  }
}