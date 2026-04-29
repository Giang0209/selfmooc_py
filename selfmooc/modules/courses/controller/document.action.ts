'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
// 🎯 Import thêm hàm uploadFileToMongoGridFS
import { getCourseDocumentsService, createCourseDocumentService, deleteDocumentService } from '../services/document.service';

function getUserFromToken(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  } catch (error) {
    return null;
  }
}

export async function getCourseDocsAction(courseId: number) {
  try {
    const docs = await getCourseDocumentsService(courseId);
    return { success: true, data: docs };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function createCourseDocAction(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user || user.role !== 'teacher') return { success: false, message: 'Chỉ giáo viên mới được thao tác' };

  const courseId = Number(formData.get('course_id'));

  //  LẤY FILE ID TỪ FRONTEND
  const gridFsFileId = formData.get('gridfs_file_id') as string;
  if (!gridFsFileId) {
    return { success: false, message: 'Thiếu fileId (chưa upload file)' };
  }

  const schema = z.object({
    title: z.string().min(3, 'Tên tài liệu quá ngắn'),
    doc_type: z.enum(["lecture", "exercise", "reference", "video", "other"])
      .refine(val => !!val, { message: "Invalid document type" }),
    chapter: z.string().optional(),
    description: z.string().optional(),
    file_ext: z.string().optional(),
    file_size_kb: z.coerce.number().optional()
  });

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: parsed.error.issues[0].message };

  try {


    // Truyền ID này xuống để Service lưu vào trường storage_url
    await createCourseDocumentService(user.id, {
      ...parsed.data,
      course_id: courseId,
      gridfs_file_id: gridFsFileId
    });

    // Reset lại cache của trang (Sửa lại path cho đúng với thư mục bạn chụp ảnh)
    revalidatePath(`/courses/${courseId}`);
    return { success: true, message: '📄 Đã lưu file thẳng vào Database thành công!' };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: 'Lỗi khi lưu file: ' + error.message };
  }
}

export async function deleteCourseDocAction(documentId: number, courseId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? getUserFromToken(token) : null;
  if (!user || user.role !== 'teacher') return { success: false, message: 'Không có quyền' };

  try {
    await deleteDocumentService(documentId, user.id);
    revalidatePath(`/courses/${courseId}`);
    return { success: true, message: '🗑️ Đã xóa tài liệu' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}