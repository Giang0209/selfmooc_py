'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getCourseQuestionsService, createQuestionService, deleteQuestionService } from '../services/question.service';

function getUserFromToken(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  } catch (error) {
    return null;
  }
}

export async function getCourseQuestionsAction(courseId: number) {
  try {
    const questions = await getCourseQuestionsService(courseId);
    return { success: true, data: questions };
  } catch (error) {
    return { success: false, data: [] };
  }
}

// Hàm này nhận formData, nhưng phần dữ liệu cốt lõi sẽ nằm trong trường 'payload' dạng JSON string
export async function createQuestionAction(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user || user.role !== 'teacher') return { success: false, message: 'Chỉ giáo viên mới được thao tác' };

  const courseId = Number(formData.get('course_id'));
  
  // Parse cục JSON chứa chi tiết câu hỏi từ Frontend gửi lên
  const payloadString = formData.get('payload') as string;
  if (!payloadString) return { success: false, message: 'Dữ liệu câu hỏi bị rỗng' };
  const imageFile = formData.get('image') as File | null;

  try {
    const questionData = JSON.parse(payloadString);
    
    // Ghép course_id vào payload và đẩy xuống Service
    await createQuestionService(user.id, { 
        ...questionData, 
        course_id: courseId 
    }, imageFile);

    revalidatePath(`/courses/${courseId}`);
    return { success: true, message: '✅ Đã thêm câu hỏi vào ngân hàng!' };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: 'Lỗi khi lưu câu hỏi: ' + error.message };
  }
}

export async function deleteQuestionAction(questionId: number, courseId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? getUserFromToken(token) : null;
  if (!user || user.role !== 'teacher') return { success: false, message: 'Không có quyền' };

  try {
    await deleteQuestionService(questionId, user.id);
    revalidatePath(`/courses/${courseId}`);
    return { success: true, message: '🗑️ Đã xóa câu hỏi' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}