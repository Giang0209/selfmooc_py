import { getClassDocumentsDB, createClassDocumentDB, deleteDocumentDB } from '../models/document.model';
import { ObjectId, GridFSBucket } from 'mongodb'; // 🎯 Thêm GridFSBucket
import { getMongoDb } from '@/lib/db';
import { Readable } from 'stream'; // 🎯 Thêm Stream để đọc nhị phân


export async function getClassDocumentsService(classId: number) {
    // 1. Lấy danh sách tài liệu từ Postgres
    const pgDocs = await getClassDocumentsDB(classId);
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
            storage_url: mongoDoc?.storage_url || '#'
        };
    });
}



// 3. Tạo document cho class
export async function createClassDocumentService(teacherId: number, data: any) {
    const newMongoId = new ObjectId();

    try {
        const newPgDocument = await createClassDocumentDB({
            class_id: data.class_id,
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
            storage_url: `/api/files/${data.gridfs_file_id}`, // dùng chung route files
            cdn_url: data.cdn_url || '',
            processing_status: 'done',
            created_at: new Date(),
            updated_at: new Date()
        });

        return newPgDocument;
    } catch (error: any) {
        throw new Error('Lỗi hệ thống khi đồng bộ tài liệu CLASS');
    }
}


// 4. Xóa document class
export async function deleteClassDocumentService(documentId: number, teacherId: number) {
    const mongoIdStr = await deleteDocumentDB(documentId, teacherId);

    if (!mongoIdStr) {
        throw new Error('Không thể xóa tài liệu class');
    }

    try {
        const db = await getMongoDb();
        const mongoId = new ObjectId(mongoIdStr);

        const documentContent = await db.collection('document_content').findOne({ _id: mongoId });

        if (documentContent) {
            if (documentContent.storage_url?.includes('/api/files/')) {
                const gridFsFileIdStr = documentContent.storage_url.split('/').pop();

                if (gridFsFileIdStr) {
                    const bucket = new GridFSBucket(db, { bucketName: 'class_files' }); // 🎯 KHÁC course

                    try {
                        await bucket.delete(new ObjectId(gridFsFileIdStr));
                        console.log(`🗑️ Deleted class file: ${gridFsFileIdStr}`);
                    } catch {
                        console.log(`⚠️ File không tồn tại trong GridFS`);
                    }
                }
            }

            await db.collection('document_content').deleteOne({ _id: mongoId });
        }

        return true;
    } catch (error) {
        console.error('🔥 Lỗi xóa class document:', error);
        return true;
    }
}