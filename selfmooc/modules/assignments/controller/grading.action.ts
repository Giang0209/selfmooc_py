'use server';

import { cookies } from 'next/headers';
import { pgPool, getMongoDb } from '@/lib/db';

function getUserFromToken(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
  } catch (error) { return null; }
}

// 1. LẤY CHI TIẾT BÀI LÀM ĐỂ CHẤM
export async function getSubmissionDetailAction(submissionId: number) {
  const client = await pgPool.connect();
  try {
    // Lấy thông tin chung từ Postgres
    const subRes = await client.query(`
      SELECT s.*, a.title as assignment_title, st.name as student_name, st.student_code
      FROM submission s
      JOIN assignment a ON s.assignment_id = a.assignment_id
      JOIN student st ON s.student_id = st.student_id
      WHERE s.submission_id = $1
    `, [submissionId]);
    
    if (subRes.rows.length === 0) return { success: false, message: 'Không tìm thấy bài nộp' };
    const submission = subRes.rows[0];

    // Lấy chi tiết câu trả lời từ Mongo
    const db = await getMongoDb();
    const validation = await db.collection('validation').findOne({ pg_submission_id: submissionId });
    
    return { success: true, data: { submission, answers: validation?.answers || [] } };
  } catch (error) {
    return { success: false, message: 'Lỗi lấy dữ liệu chấm bài' };
  } finally {
    client.release();
  }
}

// 2. LƯU ĐIỂM CHẤM TỰ LUẬN & BẮN THÔNG BÁO
export async function saveGradeAction(submissionId: number, manualGrades: Record<number, { points: number, comment: string }>) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? getUserFromToken(token) : null;
  if (!user || user.role !== 'teacher') return { success: false, message: 'Chỉ giáo viên mới được chấm bài' };

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lấy validation hiện tại từ Mongo
    const db = await getMongoDb();
    const validation = await db.collection('validation').findOne({ pg_submission_id: submissionId });
    if (!validation) throw new Error('Không tìm thấy dữ liệu bài làm');

    let totalScore = 0;
    const maxScore = validation.answers.reduce((sum: number, ans: any) => sum + (ans.points_max || 0), 0);

    // 2. Cập nhật điểm cho các câu tự luận
    const updatedAnswers = validation.answers.map((ans: any) => {
      if (manualGrades[ans.pg_question_id]) {
        // Cập nhật điểm giáo viên chấm
        ans.points_earned = manualGrades[ans.pg_question_id].points;
        ans.teacher_comment = manualGrades[ans.pg_question_id].comment;
        ans.is_correct = ans.points_earned > 0;
      }
      totalScore += (ans.points_earned || 0);
      return ans;
    });

    // 3. Tính điểm hệ 10
    const finalGrade = maxScore > 0 ? (totalScore / maxScore) * 10 : 0;

    // 4. Lưu vào Mongo
    await db.collection('validation').updateOne(
      { pg_submission_id: submissionId },
      { $set: { answers: updatedAnswers } }
    );

    // 5. Cập nhật Postgres sang trạng thái ĐÃ CHẤM (graded)
    await client.query(`
      UPDATE submission 
      SET score = $1, grade = $2, status = 'graded' 
      WHERE submission_id = $3 RETURNING student_id, assignment_id
    `, [totalScore, finalGrade, submissionId]);
    
    // Lấy thông tin bài tập để gửi thông báo
    const subInfo = await client.query('SELECT a.title, s.student_id FROM submission s JOIN assignment a ON s.assignment_id = a.assignment_id WHERE s.submission_id = $1', [submissionId]);

    // 6. 🚀 BẮN THÔNG BÁO CHO HỌC SINH VÀO MONGODB
    if (subInfo.rows.length > 0) {
      await db.collection('notification').insertOne({
        recipient_id: subInfo.rows[0].student_id,
        recipient_type: 'student',
        type: 'submission_graded',
        title: 'Thầy/Cô đã chấm bài của bạn!',
        body: `Bài tập "${subInfo.rows[0].title}" đã có điểm. Vào Nhật ký học tập để xem chi tiết nhé!`,
        is_read: false,
        created_at: new Date()
      });
    }

    await client.query('COMMIT');
    return { success: true, message: '✅ Chấm bài thành công!' };
  } catch (error: any) {
    await client.query('ROLLBACK');
    return { success: false, message: error.message };
  } finally {
    client.release();
  }
}