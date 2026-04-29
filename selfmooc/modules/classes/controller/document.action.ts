'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';


import {
    getClassDocumentsService,
    createClassDocumentService,
    deleteClassDocumentService
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
// 1. GET
// =======================
export async function getClassDocsAction(classId: number) {
    try {
        const data = await getClassDocumentsService(classId);
        return { success: true, data };
    } catch {
        return { success: false, data: [] };
    }
}

// =======================
// 2. CREATE
// =======================
export async function createClassDocAction(formData: FormData) {
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
        class_id: z.coerce.number()
    });

    const parsed = schema.safeParse(Object.fromEntries(formData.entries()));

    if (!parsed.success) {
        return {
            success: false,
            message: parsed.error.issues[0].message
        };
    }

    try {
        await createClassDocumentService(user.id, parsed.data);

        revalidatePath(`/classes/${parsed.data.class_id}`);

        return {
            success: true,
            message: 'Upload tài liệu lớp thành công 🚀'
        };

    } catch (err: any) {
        return {
            success: false,
            message: err.message
        };
    }
}

// =======================
// 3. DELETE
// =======================
export async function deleteClassDocAction(
    documentId: number,
    classId: number
) {
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
            message: 'Đã xoá tài liệu lớp 🗑️'
        };

    } catch (err: any) {
        return {
            success: false,
            message: err.message
        };
    }
}