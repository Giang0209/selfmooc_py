'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// 🎯 IMPORT SERVICE CỦA CLASS (không dùng course nữa)
import {
    getClassDocumentsService,
    createClassDocumentService,
    deleteClassDocumentService
} from '../services/document.service';

function getUserFromToken(token: string) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    } catch (error) {
        return null;
    }
}

// 1. LẤY DANH SÁCH TÀI LIỆU THEO CLASS
export async function getClassDocsAction(classId: number) {
    try {
        const docs = await getClassDocumentsService(classId);
        return { success: true, data: docs };
    } catch (error) {
        return { success: false, data: [] };
    }
}

// 2. TẠO TÀI LIỆU CHO CLASS
export async function createClassDocAction(formData: FormData) {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return { success: false, message: 'Chưa đăng nhập' };

    const user = getUserFromToken(token);
    if (!user || user.role !== 'teacher') {
        return { success: false, message: 'Chỉ giáo viên mới được thao tác' };
    }

    const classId = Number(formData.get('class_id'));

    const gridFsFileId = formData.get('gridfs_file_id') as string;
    if (!gridFsFileId) {
        return { success: false, message: 'Thiếu fileId (chưa upload file)' };
    }

    const schema = z.object({
        title: z.string().min(3, 'Tên tài liệu quá ngắn'),
        doc_type: z.enum(["lecture", "exercise", "reference", "video", "other"]),
        chapter: z.string().optional(),
        description: z.string().optional(),
        file_ext: z.string().optional(),
        file_size_kb: z.coerce.number().optional()
    });

    const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
        return { success: false, message: parsed.error.issues[0].message };
    }

    try {
        await createClassDocumentService(user.id, {
            ...parsed.data,
            class_id: classId, // 🎯 KHÁC COURSE
            gridfs_file_id: gridFsFileId
        });

        revalidatePath(`/classes/${classId}`);

        return {
            success: true,
            message: '📄 Upload tài liệu cho lớp thành công!'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Lỗi khi lưu file: ' + error.message
        };
    }
}

// 3. XÓA TÀI LIỆU CLASS
export async function deleteClassDocAction(documentId: number, classId: number) {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const user = token ? getUserFromToken(token) : null;

    if (!user || user.role !== 'teacher') {
        return { success: false, message: 'Không có quyền' };
    }

    try {
        await deleteClassDocumentService(documentId, user.id);

        revalidatePath(`/classes/${classId}`);

        return {
            success: true,
            message: '🗑️ Đã xóa tài liệu lớp'
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message
        };
    }
}