import {
  getCourseDocumentsDB,
  createCourseDocumentDB,
  deleteDocumentDB
} from '../models/document.model';

import cloudinary from '@/lib/cloudinary';

// =======================
// 1. GET DOCUMENTS
// =======================
export async function getCourseDocumentsService(courseId: number) {
  return await getCourseDocumentsDB(courseId);
}


// =======================
// 2. CREATE DOCUMENT (GIỐNG CLASS STYLE)
// =======================
export async function createCourseDocumentService(
  teacherId: number,
  data: any
) {
  const newDoc = await createCourseDocumentDB({
    course_id: data.course_id,
    uploaded_by: teacherId,
    title: data.title,
    description: data.description,
    doc_type: data.doc_type,
    chapter: data.chapter,
    file_ext: data.file_ext,
    file_size_kb: data.file_size_kb,
    file_url: data.file_url,
    cloudinary_id: data.cloudinary_id
  });

  return newDoc;
}


// =======================
// 3. DELETE DOCUMENT (GIỐNG CLASS STYLE)
// =======================
export async function deleteCourseDocumentService(
  documentId: number,
  teacherId: number
) {
  const cloudinaryId = await deleteDocumentDB(documentId, teacherId);

  if (!cloudinaryId) {
    throw new Error("Không có quyền hoặc tài liệu không tồn tại");
  }

  // xoá file Cloudinary
  await cloudinary.uploader.destroy(cloudinaryId);

  return true;
}