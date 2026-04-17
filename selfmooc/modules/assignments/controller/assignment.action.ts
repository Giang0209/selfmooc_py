'use server';

import { cookies } from 'next/headers';
import { createAssignmentDB, getClassCourseIdDB } from '../models/assignment.model';
import { ObjectId } from 'mongodb';
import { getMongoDb, pgPool } from '@/lib/db'; 

function getUserFromToken(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
  } catch (error) { return null; }
}

// 🎯 Đã viết lại hàm này để Join đếm số lượt học sinh đã làm
export async function getClassAssignmentsAction(classId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? getUserFromToken(token) : null;
  if (!user) return { success: false, data: [] };

  const client = await pgPool.connect();
  try {
    const res = await client.query(`
      SELECT a.*,
        (SELECT COUNT(*) FROM submission s WHERE s.assignment_id = a.assignment_id AND s.student_id = $1) as student_attempts
      FROM assignment a
      WHERE a.class_id = $2
      ORDER BY a.created_at DESC
    `, [user.id, classId]);
    return { success: true, data: res.rows };
  } catch(e) { 
    return { success: false, data: [] }; 
  } finally {
    client.release();
  }
}

export async function getCourseIdOfClassAction(classId: number) {
  try {
    const courseId = await getClassCourseIdDB(classId);
    return { success: true, courseId };
  } catch(e) { 
    return { success: false, courseId: null }; 
  }
}

export async function createAssignmentAction(formData: FormData, selectedQuestionIds: number[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? getUserFromToken(token) : null;
  if (!user || user.role !== 'teacher') return { success: false, message: 'Không có quyền' };

  if (selectedQuestionIds.length === 0) {
    return { success: false, message: '⚠️ Vui lòng tick chọn ít nhất 1 câu hỏi từ Ngân hàng đề!' };
  }

  try {
    const dueDateStr = formData.get('due_date') as string;
    const payload = {
      class_id: Number(formData.get('class_id')),
      teacher_id: user.id,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      assignment_type: formData.get('assignment_type') || 'quiz',
      due_date: dueDateStr ? new Date(dueDateStr) : null,
      time_limit_min: Number(formData.get('time_limit_min')) || null,
      max_attempts: formData.get('max_attempts') ? Number(formData.get('max_attempts')) : null,
    };

    if (!payload.title) return { success: false, message: 'Vui lòng nhập tên bài tập!' };

    await createAssignmentDB(payload, selectedQuestionIds);
    return { success: true, message: '✅ Đã giao bài tập thành công cho toàn bộ lớp!' };
  } catch (error: any) {
    return { success: false, message: 'Lỗi khi giao bài: ' + error.message };
  }
}

export async function getAssignmentForStudentAction(assignmentId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };
  const user = getUserFromToken(token); // 🎯 Lấy user

  const client = await pgPool.connect();
  try {
    const assRes = await client.query('SELECT * FROM assignment WHERE assignment_id = $1', [assignmentId]);
    if (assRes.rows.length === 0) return { success: false, message: 'Không tìm thấy bài tập' };
    const assignment = assRes.rows[0];

    // 🎯 CHẶN HỌC SINH NẾU ĐÃ HẾT LƯỢT LÀM BÀI
    if (assignment.max_attempts) {
      const subRes = await client.query('SELECT COUNT(*) FROM submission WHERE assignment_id = $1 AND student_id = $2', [assignmentId, user.id]);
      const attempts = parseInt(subRes.rows[0].count);
      if (attempts >= assignment.max_attempts) {
        return { success: false, message: '⚠️ Bạn đã hết số lần làm bài cho phép!' };
      }
    }

    const qRes = await client.query(`
      SELECT q.question_id, q.question_type, q.mongo_id, aq.points, aq.display_order
      FROM assignment_question aq
      JOIN question q ON aq.question_id = q.question_id
      WHERE aq.assignment_id = $1
      ORDER BY aq.display_order ASC
    `, [assignmentId]);
    
    const pgQuestions = qRes.rows;
    if (pgQuestions.length === 0) return { success: true, data: { assignment, questions: [] } };

    const mongoIds = pgQuestions.map(q => new ObjectId(q.mongo_id));
    const db = await getMongoDb();
    const mongoQuestions = await db.collection('question_content').find({ _id: { $in: mongoIds } }).toArray();

    const safeQuestions = pgQuestions.map(pgQ => {
      const content = mongoQuestions.find(m => m._id.toString() === pgQ.mongo_id);
      if (!content) return null; 
      
      let safeContent: any = { ...content, _id: content._id.toString() };
      delete safeContent.correct_answer;
      delete safeContent.sample_answer;
      delete safeContent.explanation;
      delete safeContent.rubric;      
      
      if (safeContent.options && Array.isArray(safeContent.options)) {
        safeContent.options = safeContent.options.map((opt: any) => ({
          label: opt.label,
          text: opt.text
        }));
      }

      return {
        question_id: pgQ.question_id,
        question_type: pgQ.question_type,
        points: pgQ.points,
        content: safeContent
      };
    }).filter(q => q !== null);

    return { success: true, data: { assignment, questions: safeQuestions } };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Lỗi hệ thống khi tải đề thi' };
  } finally {
    client.release();
  }
}

export async function getAssignmentSelectedQuestionsAction(assignmentId: number) {
  const client = await pgPool.connect();
  try {
    const res = await client.query('SELECT question_id FROM assignment_question WHERE assignment_id = $1', [assignmentId]);
    return { success: true, data: res.rows.map(r => r.question_id) };
  } catch (error) {
    return { success: false, data: [] };
  } finally {
    client.release();
  }
}

export async function updateAssignmentAction(assignmentId: number, formData: FormData, selectedQuestionIds: number[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? getUserFromToken(token) : null;
  if (!user || user.role !== 'teacher') return { success: false, message: 'Không có quyền' };

  if (selectedQuestionIds.length === 0) return { success: false, message: '⚠️ Vui lòng tick chọn ít nhất 1 câu hỏi!' };

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    
    const dueDateStr = formData.get('due_date') as string;
    const maxAttempts = formData.get('max_attempts') ? Number(formData.get('max_attempts')) : null;

    await client.query(`
      UPDATE assignment 
      SET title = $1, description = $2, assignment_type = $3, time_limit_min = $4, due_date = $5, max_attempts = $6
      WHERE assignment_id = $7 AND created_by = $8
    `, [
      formData.get('title'), formData.get('description'), formData.get('assignment_type'),
      Number(formData.get('time_limit_min')) || null, dueDateStr ? new Date(dueDateStr) : null,
      maxAttempts, assignmentId, user.id
    ]);

    await client.query('DELETE FROM assignment_question WHERE assignment_id = $1', [assignmentId]);

    for (let i = 0; i < selectedQuestionIds.length; i++) {
      await client.query(`
        INSERT INTO assignment_question (assignment_id, question_id, points, display_order) 
        VALUES ($1, $2, $3, $4)
      `, [assignmentId, selectedQuestionIds[i], 1, i + 1]); 
    }

    await client.query('COMMIT');
    return { success: true, message: '✅ Đã cập nhật bài tập thành công!' };
  } catch (error: any) {
    await client.query('ROLLBACK');
    return { success: false, message: 'Lỗi cập nhật: ' + error.message };
  } finally {
    client.release();
  }
}