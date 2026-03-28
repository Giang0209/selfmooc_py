import { getCourseDocumentsDB, createCourseDocumentDB, deleteDocumentDB } from '../models/document.model';
import { ObjectId, GridFSBucket } from 'mongodb'; // 🎯 Thêm GridFSBucket
import { getMongoDb } from '@/lib/db'; 
import { Readable } from 'stream'; // 🎯 Thêm Stream để đọc nhị phân
import { file } from 'zod/v4/mini';

export async function getCourseDocumentsService(courseId: number) {
  // 1. Lấy danh sách tài liệu từ Postgres
  const pgDocs = await getCourseDocumentsDB(courseId);
  if (pgDocs.length === 0) return [];

  // 2. Gom hết ID lại để chạy sang MongoDB tìm một lượt cho nhanh
  const pgDocIds = pgDocs.map(d => d.document_id);

  const db = await getMongoDb();
  const mongoDocs = await db.collection('document_content')
    .find({ pg_document_id: { $in: pgDocIds } })
    .toArray();

  // 3. Ghép Link URL từ Mongo vào dữ liệu Postgres
  return pgDocs.map(pgDoc => {
    const mongoDoc = mongoDocs.find(m => m.pg_document_id === pgDoc.document_id);
    return {
      ...pgDoc,
      storage_url: mongoDoc?.storage_url || '#' // Nếu có file thì gắn link, ko thì để trống
    };
  });
}

// 🎯 HÀM MỚI: Bơm file thẳng vào MongoDB GridFS
export async function uploadFileToMongoGridFS(fileBuffer: Buffer, fileName: string, mimeType: string) {
  const db = await getMongoDb();
  const bucket = new GridFSBucket(db, { bucketName: 'course_files' });

  return new Promise<string>((resolve, reject) => {
    
    // 🎯 SỬA LẠI CHUẨN MONGODB DRIVER V4/V5: Nhét vào trong hộp metadata
    const uploadStream = bucket.openUploadStream(fileName, {
      metadata: {
        contentType: mimeType
      }
    });

    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);

    readableStream.pipe(uploadStream)
      .on('error', (error) => reject(error))
      .on('finish', () => {
        resolve(uploadStream.id.toString());
      });
  });
}

export async function createCourseDocumentService(teacherId: number, data: any) {
  const newMongoId = new ObjectId();

  try {
    const newPgDocument = await createCourseDocumentDB({
      course_id: data.course_id,
      uploaded_by: teacherId,
      title: data.title,
      description: data.description,
      doc_type: data.doc_type,
      chapter: data.chapter,
      file_ext: data.file_ext,
      file_size_kb: data.file_size_kb,
      mongo_id: newMongoId.toString() 
    });

    const mongoDb = await getMongoDb();
    await mongoDb.collection('document_content').insertOne({
      _id: newMongoId,
      pg_document_id: newPgDocument.document_id, 
      title: data.title,
      // 🎯 Lưu link chứa ID của file. Lúc nào cần xem, gọi API này là file tự trào ra!
      storage_url: `/api/files/${data.gridfs_file_id}`, 
      cdn_url: data.cdn_url || '',
      processing_status: 'done',
      created_at: new Date(),
      updated_at: new Date()
    });

    return newPgDocument;
  } catch (error: any) {
    throw new Error('Lỗi hệ thống khi đồng bộ tài liệu giữa Postgres và MongoDB');
  }
}

export async function deleteDocumentService(documentId: number, teacherId: number) {
  // 1. Cắt đứt ở Postgres và lấy ID của Mongo
  const mongoIdStr = await deleteDocumentDB(documentId, teacherId);
  
  if (!mongoIdStr) {
    throw new Error('Không thể xóa. Tài liệu không tồn tại hoặc bạn không có quyền!');
  }

  // 2. Dọn rác bên MongoDB và GridFS
  try {
    const db = await getMongoDb();
    const mongoId = new ObjectId(mongoIdStr);
    
    // 🎯 2.1 Lấy thông tin tài liệu từ Mongo để dò tìm ID của file cứng
    const documentContent = await db.collection('document_content').findOne({ _id: mongoId });
    
    if (documentContent) {
      // 🎯 2.2 Trích xuất ID file từ storage_url (ví dụ: /api/files/60a7...)
      if (documentContent.storage_url && documentContent.storage_url.includes('/api/files/')) {
        const gridFsFileIdStr = documentContent.storage_url.split('/').pop(); // Cắt lấy đuôi URL
        
        if (gridFsFileIdStr) {
          const bucket = new GridFSBucket(db, { bucketName: 'course_files' });
          try {
            // Xóa file vật lý (PDF, Video...) nằm trong thùng chứa GridFS
            await bucket.delete(new ObjectId(gridFsFileIdStr));
            console.log(`🗑️ Đã xóa sạch file cứng trong GridFS: ${gridFsFileIdStr}`);
          } catch (err) {
            console.log(`⚠️ File không tồn tại trong GridFS (có thể đã bị xóa thủ công trước đó)`);
          }
        }
      }

      // 🎯 2.3 Xóa nốt cái vỏ thông tin lưu trong collection
      await db.collection('document_content').deleteOne({ _id: mongoId });
      console.log(`🗑️ Đã xóa siêu dữ liệu tài liệu khỏi MongoDB: ${mongoIdStr}`);
    }
    
    return true;
  } catch (error: any) {
    console.error('🔥 Lỗi khi dọn rác tài liệu MongoDB:', error);
    return true; // Postgres đã xóa thành công thì cứ cho qua, tránh treo UI
  }
}