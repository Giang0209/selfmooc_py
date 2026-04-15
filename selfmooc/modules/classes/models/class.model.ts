import { pgPool } from '@/lib/db';

// 1. Lấy danh sách lớp của một giáo viên
export async function getClassesByTeacherDB(teacherId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT c.*, co.name as course_name, co.thumbnail_url, co.theme_color,
             (SELECT COUNT(*) FROM enrollment WHERE class_id = c.class_id AND status = 'active') as student_count
      FROM class c
      JOIN course co ON c.course_id = co.course_id
      WHERE c.teacher_id = $1
      ORDER BY c.created_at DESC
    `;
    const result = await client.query(query, [teacherId]);
    return result.rows;
  } finally {
    client.release();
  }
}

// 2. Tạo lớp học mới
export async function createClassDB(data: {
  course_id: number;
  teacher_id: number;
  name: string;
  academic_year: string;
  semester: number;
  max_students: number;
}) {
  const client = await pgPool.connect();
  try {
    const query = `
      INSERT INTO class (course_id, teacher_id, name, academic_year, semester, max_students)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [data.course_id, data.teacher_id, data.name, data.academic_year, data.semester, data.max_students];
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

// 3. Lấy danh sách học sinh đang học trong lớp
export async function getClassStudentsDB(classId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT s.student_id, s.name, s.student_code, s.avatar_url, e.status, e.enrolled_at
      FROM enrollment e
      JOIN student s ON e.student_id = s.student_id
      WHERE e.class_id = $1
      ORDER BY e.enrolled_at DESC
    `;
    const result = await client.query(query, [classId]);
    return result.rows;
  } finally {
    client.release();
  }
}

// 4. Thêm học sinh vào lớp bằng Mã học sinh (student_code)
export async function enrollStudentByCodeDB(classId: number, studentCode: string) {
  const client = await pgPool.connect();
  try {
    // Tìm ID học sinh từ mã
    const findStudent = await client.query('SELECT student_id, name FROM student WHERE student_code = $1', [studentCode]);
    if (findStudent.rows.length === 0) throw new Error('Không tìm thấy mã học sinh này!');
    
    const student = findStudent.rows[0];

    // Kiểm tra xem đã trong lớp chưa
    const checkExist = await client.query('SELECT 1 FROM enrollment WHERE class_id = $1 AND student_id = $2', [classId, student.student_id]);
    if (checkExist.rows.length > 0) throw new Error(`Học sinh ${student.name} đã ở trong lớp này rồi!`);

    // Thêm vào lớp
    await client.query(
      'INSERT INTO enrollment (class_id, student_id, status) VALUES ($1, $2, $3)', 
      [classId, student.student_id, 'active']
    );

    return student.name;
  } finally {
    client.release();
  }
}

// 5. Xóa học sinh khỏi lớp
export async function removeStudentFromClassDB(classId: number, studentId: number) {
  const client = await pgPool.connect();
  try {
    await client.query('DELETE FROM enrollment WHERE class_id = $1 AND student_id = $2', [classId, studentId]);
  } finally {
    client.release();
  }
}

// Lấy tài liệu của Lớp học VÀ tài liệu kế thừa từ Khóa học gốc
export async function getClassAndCourseDocumentsDB(classId: number) {
  const client = await pgPool.connect();
  try {
    // 1. Tìm xem lớp này thuộc Khóa học nào
    const courseRes = await client.query('SELECT course_id FROM class WHERE class_id = $1', [classId]);
    const courseId = courseRes.rows[0]?.course_id;

    // 2. Lấy tài liệu: Hoặc của Khóa học, hoặc tải riêng cho Lớp này
    let query = `
      SELECT document_id, title, description, doc_type, file_ext, course_id, class_id, created_at
      FROM document
      WHERE class_id = $1 ${courseId ? 'OR course_id = $2' : ''}
      ORDER BY created_at DESC
    `;
    const params = courseId ? [classId, courseId] : [classId];
    
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getAttendanceListDB(classId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT 
        s.student_id, 
        s.name, 
        s.student_code,
        -- Lấy trạng thái hôm nay, nếu chưa điểm danh thì mặc định là 'present'
        COALESCE(a_today.status, 'present') as today_status,
        -- Đếm tổng số lần vắng mặt của học sinh này trong lớp
        (SELECT COUNT(*) FROM attendance a_past WHERE a_past.student_id = s.student_id AND a_past.class_id = $1 AND a_past.status = 'absent') as total_absences
      FROM enrollment e
      JOIN student s ON e.student_id = s.student_id
      LEFT JOIN attendance a_today 
        ON e.student_id = a_today.student_id 
        AND a_today.class_id = $1 
        AND a_today.session_date = CURRENT_DATE
      WHERE e.class_id = $1 AND e.status = 'active'
      ORDER BY s.name ASC;
    `;
    const result = await client.query(query, [classId]);
    return result.rows;
  } finally {
    client.release();
  }
}

// Lưu điểm danh HÀNG LOẠT (Dùng Transaction để đảm bảo lưu thành công tất cả)
export async function saveBulkAttendanceDB(classId: number, teacherId: number, records: { student_id: number, status: string }[]) {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN'); // Bắt đầu phiên giao dịch
    
    const query = `
      INSERT INTO attendance (class_id, student_id, session_date, status, recorded_by, recorded_at)
      VALUES ($1, $2, CURRENT_DATE, $3, $4, NOW())
      ON CONFLICT (class_id, student_id, session_date) 
      DO UPDATE SET 
        status = EXCLUDED.status, 
        recorded_by = EXCLUDED.recorded_by, 
        recorded_at = NOW(); -- Cập nhật lại đúng mốc thời gian (giờ:phút) khi bấm Lưu
    `;
    
    // Duyệt qua mảng và lưu từng học sinh
    for (const record of records) {
      await client.query(query, [classId, record.student_id, record.status, teacherId]);
    }
    
    await client.query('COMMIT'); // Chốt sổ
    return true;
  } catch (error) {
    await client.query('ROLLBACK'); // Lỗi thì hoàn tác
    throw error;
  } finally {
    client.release();
  }
}

// Lấy Lịch sử điểm danh (Hiển thị mốc thời gian chi tiết)
// 2. Lấy Lịch sử điểm danh
export async function getAttendanceHistoryDB(classId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT a.attendance_id, s.name, s.student_code, a.session_date, a.status, a.recorded_at
      FROM attendance a
      JOIN student s ON a.student_id = s.student_id
      WHERE a.class_id = $1
      ORDER BY a.session_date DESC, s.name ASC
    `;
    const result = await client.query(query, [classId]);
    return result.rows;
  } finally {
    client.release();
  }
}