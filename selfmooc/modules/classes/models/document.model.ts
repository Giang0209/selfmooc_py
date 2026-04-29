import { pgPool } from '@/lib/db';

// 1. Lấy danh sách tài liệu của một Môn học
export async function getClassDocumentsDB(classId: number) {
    const client = await pgPool.connect();
    try {
        const query = `
      SELECT document_id, title, description, doc_type, chapter, file_ext, file_size_kb, is_visible, created_at 
      FROM document 
      WHERE class_id = $1 
      ORDER BY created_at DESC
    `;
        const result = await client.query(query, [classId]);
        return result.rows;
    } finally {
        client.release();
    }
}

// 2. Thêm tài liệu mới vào Môn học
export async function createClassDocumentDB(data: {
    class_id: number;
    uploaded_by: number;
    title: string;
    description?: string;
    doc_type: string;
    chapter?: string;
    file_ext?: string;
    file_size_kb?: number;
    mongo_id: string; // ID liên kết sang MongoDB (hiện tại mình sẽ giả lập)
}) {
    const client = await pgPool.connect();
    try {
        const query = `
      INSERT INTO document (class_id, uploaded_by, title, description, doc_type, chapter, file_ext, file_size_kb, mongo_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING document_id, title
    `;
        const values = [
            data.class_id, data.uploaded_by, data.title, data.description,
            data.doc_type, data.chapter, data.file_ext, data.file_size_kb, data.mongo_id
        ];
        const result = await client.query(query, values);
        return result.rows[0];
    } finally {
        client.release();
    }
}

// 3. Xóa tài liệu
export async function deleteDocumentDB(documentId: number, teacherId: number) {
    const client = await pgPool.connect();
    try {
        // 🎯 Thêm RETURNING mongo_id để nhả ID ra cho tầng Service dọn dẹp
        const query = `DELETE FROM document WHERE document_id = $1 AND uploaded_by = $2 RETURNING mongo_id`;
        const result = await client.query(query, [documentId, teacherId]);

        // Nếu xóa thành công thì trả về chuỗi mongo_id, ngược lại trả về null
        return result.rowCount && result.rowCount > 0 ? result.rows[0].mongo_id : null;
    } finally {
        client.release();
    }
}