import { pgPool } from '@/lib/db';

// 1. Lấy danh sách tài liệu của một môn học
export async function getCourseDocumentsDB(courseId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT 
        document_id,
        title,
        description,
        doc_type,
        chapter,
        file_ext,
        file_size_kb,
        file_url,
        cloudinary_id,
        is_visible,
        created_at 
      FROM document 
      WHERE course_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [courseId]);
    return result.rows;
  } finally {
    client.release();
  }
}

// 2. Thêm tài liệu mới
export async function createCourseDocumentDB(data: {
  course_id: number;
  uploaded_by: number;
  title: string;
  description?: string;
  doc_type: string;
  chapter?: string;
  file_ext?: string;
  file_size_kb?: number;
  file_url: string;
  cloudinary_id: string;
}) {
  const client = await pgPool.connect();
  try {
    const query = `
      INSERT INTO document (
        course_id, uploaded_by, title, description,
        doc_type, chapter, file_ext, file_size_kb,
        file_url, cloudinary_id
      ) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) 
      RETURNING document_id, title
    `;

    const values = [
      data.course_id,
      data.uploaded_by,
      data.title,
      data.description,
      data.doc_type,
      data.chapter,
      data.file_ext,
      data.file_size_kb,
      data.file_url,
      data.cloudinary_id
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
    const query = `
      DELETE FROM document 
      WHERE document_id = $1 AND uploaded_by = $2
      RETURNING cloudinary_id
    `;

    const result = await client.query(query, [documentId, teacherId]);

    return result.rowCount && result.rowCount > 0
      ? result.rows[0].cloudinary_id
      : null;

  } finally {
    client.release();
  }
}