import { pgPool } from '@/lib/db';
import { getMongoDb } from '@/lib/db';

export async function submitAssignmentDB(data: {
  assignment_id: number;
  student_id: number;
  answers: any[]; 
  score: number;
  max_score: number;
  grade: number;
  status: string; 
  total_time_sec?: number;
}) {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN'); // Bắt đầu Transaction
    
    // 1. Xác định số lần làm bài (Lần 1, Lần 2...)
    const attemptRes = await client.query('SELECT MAX(attempt_number) as max_attempt FROM submission WHERE assignment_id = $1 AND student_id = $2', [data.assignment_id, data.student_id]);
    const attemptNumber = (attemptRes.rows[0].max_attempt || 0) + 1;

    // 2. Lưu Vỏ điểm số vào Postgres
    const pgRes = await client.query(`
      INSERT INTO submission (assignment_id, student_id, attempt_number, score, max_score, grade, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING submission_id
    `, [data.assignment_id, data.student_id, attemptNumber, data.score, data.max_score, data.grade, data.status]);
    
    const submissionId = pgRes.rows[0].submission_id;

    // 3. Lưu Chi tiết từng câu trả lời vào MongoDB (Collection: validation)
    const db = await getMongoDb();
    const mongoRes = await db.collection('validation').insertOne({
      pg_submission_id: submissionId,
      pg_assignment_id: data.assignment_id,
      pg_student_id: data.student_id,
      attempt_number: attemptNumber,
      answers: data.answers,
      submitted_at: new Date(),
      total_time_sec: data.total_time_sec || 0
    });

    // 4. Cập nhật lại ID của Mongo vào bảng Postgres để dễ tra cứu sau này
    await client.query('UPDATE submission SET mongo_id = $1 WHERE submission_id = $2', [mongoRes.insertedId.toString(), submissionId]);

    await client.query('COMMIT'); // Hoàn tất
    return submissionId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}