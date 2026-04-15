'use server';

import { cookies } from 'next/headers';
import { submitAssignmentDB } from '../models/submission.model';
import { pgPool } from '@/lib/db';
import { getMongoDb } from '@/lib/db';
import { ObjectId } from 'mongodb';

function getUserFromToken(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
  } catch (error) { return null; }
}

export async function submitAssignmentAction(assignmentId: number, studentAnswers: Record<number, any>, timeSpentSec: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? getUserFromToken(token) : null;

  if (!user || user.role !== 'student') return { success: false, message: 'Chỉ học sinh mới được nộp bài' };

  const client = await pgPool.connect();
  try {
    // 1. Lấy danh sách câu hỏi của bài tập này để chấm điểm
    const qRes = await client.query(`
      SELECT q.question_id, q.question_type, q.mongo_id, aq.points
      FROM assignment_question aq
      JOIN question q ON aq.question_id = q.question_id
      WHERE aq.assignment_id = $1
    `, [assignmentId]);

    const pgQuestions = qRes.rows;
    const mongoIds = pgQuestions.map(q => new ObjectId(q.mongo_id));

    // 2. Kéo đáp án đúng từ MongoDB ra
    const db = await getMongoDb();
    const mongoQuestions = await db.collection('question_content').find({ _id: { $in: mongoIds } }).toArray();

    let totalScore = 0;
    let maxScore = 0;
    let needsManualGrading = false;
    let correctCount = 0; // Thêm biến đếm số câu đúng
    const totalQuestions = pgQuestions.length; // Tổng số câu
    const formattedAnswers = [];

    // 3. THUẬT TOÁN CHẤM ĐIỂM TỰ ĐỘNG
    for (const pgQ of pgQuestions) {
      const qContent = mongoQuestions.find(m => m._id.toString() === pgQ.mongo_id);
      if (!qContent) continue;

      const studentAns = studentAnswers[pgQ.question_id];
      const points = parseFloat(pgQ.points);
      maxScore += points;

      let isCorrect = false;
      let pointsEarned = 0;

      if (pgQ.question_type === 'multiple_choice') {
        const correctIndex = qContent.options.findIndex((opt: any) => opt.is_correct);
        if (studentAns === correctIndex) {
          isCorrect = true;
          pointsEarned = points;
          correctCount++; // 🎯 Tăng biến đếm
        }
        formattedAnswers.push({ pg_question_id: pgQ.question_id, question_type: 'multiple_choice', selected_index: studentAns, is_correct: isCorrect, points_earned: pointsEarned, points_max: points, auto_graded: true });
      }
      // ... (Tương tự cho True/False, nếu đúng thì correctCount++)
      else if (pgQ.question_type === 'true_false') {
        if (studentAns === qContent.correct_answer) {
          isCorrect = true;
          pointsEarned = points;
          correctCount++; // 🎯 Tăng biến đếm
        }
        formattedAnswers.push({ pg_question_id: pgQ.question_id, question_type: 'true_false', bool_answer: studentAns, is_correct: isCorrect, points_earned: pointsEarned, points_max: points, auto_graded: true });
      }
      else if (pgQ.question_type === 'essay') {
        needsManualGrading = true;
        formattedAnswers.push({ pg_question_id: pgQ.question_id, question_type: 'essay', text_answer: studentAns, is_correct: false, points_earned: 0, points_max: points, auto_graded: false });
      }
      totalScore += pointsEarned;
    }

    const grade = maxScore > 0 ? (totalScore / maxScore) * 10 : 0;
    const status = needsManualGrading ? 'submitted' : 'graded';

    // 5. Lưu vào Database
    await submitAssignmentDB({
      assignment_id: assignmentId,
      student_id: user.id,
      answers: formattedAnswers,
      score: totalScore,
      max_score: maxScore,
      grade: grade,
      status: status,
      total_time_sec: timeSpentSec
    });

    return {
      success: true,
      message: '🎉 Nộp bài thành công!',
      data: {
        correctCount,
        totalQuestions,
        needsManualGrading
      }
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Lỗi hệ thống khi nộp bài' };
  } finally {
    client.release();
  }
}

// LẤY NHẬT KÝ LÀM BÀI CỦA HỌC SINH
export async function getMySubmissionsAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? getUserFromToken(token) : null;

  if (!user || user.role !== 'student') return { success: false, data: [] };

  const client = await pgPool.connect();
  try {
    const res = await client.query(`
      SELECT s.submission_id, a.title, a.assignment_type, s.status, s.grade, s.score, s.max_score, s.submitted_at
      FROM submission s
      JOIN assignment a ON s.assignment_id = a.assignment_id
      WHERE s.student_id = $1
      ORDER BY s.submitted_at DESC
    `, [user.id]);

    return { success: true, data: res.rows };
  } catch (error) {
    console.error(error);
    return { success: false, data: [] };
  } finally {
    client.release();
  }
}

// LẤY DANH SÁCH BÀI TẬP CHỜ CHẤM (CHO GIÁO VIÊN)
export async function getPendingSubmissionsAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? getUserFromToken(token) : null;

  if (!user || user.role !== 'teacher') return { success: false, data: [] };

  const client = await pgPool.connect();
  try {
    const res = await client.query(`
      SELECT s.submission_id, s.submitted_at, a.title AS assignment_title, 
             st.name AS student_name, st.student_code
      FROM submission s
      JOIN assignment a ON s.assignment_id = a.assignment_id
      JOIN student st ON s.student_id = st.student_id
      WHERE a.created_by = $1 AND s.status = 'submitted'
      ORDER BY s.submitted_at ASC
    `, [user.id]);

    return { success: true, data: res.rows };
  } catch (error) {
    console.error(error);
    return { success: false, data: [] };
  } finally {
    client.release();
  }
}