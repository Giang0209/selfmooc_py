import { pgPool } from '@/lib/db';

// 1. Tìm học sinh bằng Mã (student_code)
export async function getStudentByCodeDB(studentCode: string) {
  const client = await pgPool.connect();
  try {
    const query = 'SELECT student_id, name, avatar_url, student_code FROM student WHERE student_code = $1';
    const result = await client.query(query, [studentCode]);
    return result.rows[0];
  } finally {
    client.release();
  }
}

// 2. Kiểm tra xem đã nhận con chưa (tránh lỗi trùng lặp Primary Key)
export async function checkLinkExistsDB(parentId: number, studentId: number) {
  const client = await pgPool.connect();
  try {
    const query = 'SELECT 1 FROM parent_student WHERE parent_id = $1 AND student_id = $2';
    const result = await client.query(query, [parentId, studentId]);
    return result.rows.length > 0;
  } finally {
    client.release();
  }
}

// 3. Thêm bản ghi kết nối vào bảng parent_student
export async function linkParentAndStudentDB(parentId: number, studentId: number, relationship: string) {
  const client = await pgPool.connect();
  try {
    const query = 'INSERT INTO parent_student (parent_id, student_id, relationship) VALUES ($1, $2, $3)';
    await client.query(query, [parentId, studentId, relationship]);
  } finally {
    client.release();
  }
}

// 4. Lấy danh sách các con của một phụ huynh
export async function getChildrenByParentIdDB(parentId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT s.student_id, s.name, s.avatar_url, s.student_code, ps.relationship
      FROM student s
      JOIN parent_student ps ON s.student_id = ps.student_id
      WHERE ps.parent_id = $1
      ORDER BY s.created_at DESC
    `;
    const result = await client.query(query, [parentId]);
    return result.rows;
  } finally {
    client.release();
  }
}