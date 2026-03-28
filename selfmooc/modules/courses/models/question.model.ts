import { pgPool } from '@/lib/db';

export async function getCourseQuestionsDB(courseId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT question_id, question_type, chapter, difficulty, mongo_id, created_at 
      FROM question 
      WHERE course_id = $1 AND is_active = TRUE
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [courseId]);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function createQuestionDB(data: {
  course_id: number;
  created_by: number;
  question_type: string;
  chapter?: string;
  difficulty: number;
  mongo_id: string;
}) {
  const client = await pgPool.connect();
  try {
    const query = `
      INSERT INTO question (course_id, created_by, question_type, chapter, difficulty, mongo_id) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING question_id
    `;
    const values = [data.course_id, data.created_by, data.question_type, data.chapter, data.difficulty, data.mongo_id];
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function deleteQuestionDB(questionId: number, teacherId: number) {
  const client = await pgPool.connect();
  try {
    // 🎯 THÊM "RETURNING mongo_id" để lấy ID rác mang sang Mongo dọn tiếp
    const query = `DELETE FROM question WHERE question_id = $1 AND created_by = $2 RETURNING mongo_id`;
    const result = await client.query(query, [questionId, teacherId]);
    
    // Trả về cái mongo_id (chuỗi) nếu xóa thành công, ngược lại trả về null
    return result.rowCount && result.rowCount > 0 ? result.rows[0].mongo_id : null;
  } finally {
    client.release();
  }
}