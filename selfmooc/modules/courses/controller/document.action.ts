'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';


import {
  getCourseDocumentsService,
  createCourseDocumentService,
  deleteCourseDocumentService
} from '../services/document.service';

// =======================
// AUTH HELPER
// =======================
function getUserFromToken(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

// =======================
// 1. GET DOCUMENTS
// =======================
export async function getCourseDocsAction(courseId: number) {
  try {
    const docs = await getCourseDocumentsService(courseId);
    return { success: true, data: docs };
  } catch (err) {
    return { success: false, data: [] };
  }
}

// =======================
// 2. CREATE DOCUMENT
// =======================
export async function createCourseDocAction(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return { success: false, message: 'Chưa đăng nhập' };
  }

  const user = getUserFromToken(token);

  if (!user || user.role !== 'teacher') {
    return { success: false, message: 'Không có quyền' };
  }

  const schema = z.object({
    title: z.string().min(3),
    doc_type: z.enum(["lecture", "exercise", "reference", "video", "other"]),
    chapter: z.string().optional(),
    description: z.string().optional(),
    file_url: z.string().url(),
    cloudinary_id: z.string(),
    file_ext: z.string().optional(),
    file_size_kb: z.coerce.number().optional(),
    course_id: z.coerce.number()
  });

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0].message
    };
  }

  try {
    await createCourseDocumentService(user.id, parsed.data);

    revalidatePath(`/courses/${parsed.data.course_id}`);

    return {
      success: true,
      message: 'Upload tài liệu khóa học thành công 🚀'
    };

  } catch (err: any) {
    return {
      success: false,
      message: err.message
    };
  }
}

// =======================
// 3. DELETE DOCUMENT
// =======================
export async function deleteCourseDocAction(
  documentId: number,
  courseId: number
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  const user = token ? getUserFromToken(token) : null;

  if (!user || user.role !== 'teacher') {
    return { success: false, message: 'Không có quyền' };
  }

  try {
    await deleteCourseDocumentService(documentId, user.id);

    revalidatePath(`/courses/${courseId}`);

    return {
      success: true,
      message: 'Đã xoá tài liệu 🗑️'
    };

  } catch (err: any) {
    return {
      success: false,
      message: err.message
    };
  }
}