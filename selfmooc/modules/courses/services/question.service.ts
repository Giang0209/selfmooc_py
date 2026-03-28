import { getCourseQuestionsDB, createQuestionDB, deleteQuestionDB } from '../models/question.model';
import { ObjectId, GridFSBucket } from 'mongodb';
import { getMongoDb } from '@/lib/db';
import { Readable } from 'stream';

// 1. Lấy câu hỏi (Kết hợp Postgres + Mongo)
export async function getCourseQuestionsService(courseId: number) {
  const pgQuestions = await getCourseQuestionsDB(courseId);
  if (pgQuestions.length === 0) return [];

  const mongoIds = pgQuestions.map(q => new ObjectId(q.mongo_id));
  const db = await getMongoDb();
  
  const mongoQuestions = await db.collection('question_content')
    .find({ _id: { $in: mongoIds } })
    .toArray();

  // 🎯 PHẢI LÀM BƯỚC NÀY: Biến đổi dữ liệu thô từ Mongo thành Plain Object
  const cleanMongoQuestions = mongoQuestions.map(mq => ({
    ...mq,
    _id: mq._id.toString(), // Convert ObjectId sang String
    created_at: mq.created_at?.toISOString(), // Convert Date sang String ISO
    updated_at: mq.updated_at?.toISOString(),
    media: mq.media?.map((m: any) => ({
      ...m,
      file_id: m.file_id?.toString() // Convert ID của ảnh luôn
    }))
  }));

  return pgQuestions.map(pgQ => {
    const mongoContent = cleanMongoQuestions.find(m => m._id === pgQ.mongo_id);
    return {
      ...pgQ,
      content: mongoContent || {}
    };
  });
}

// 2. Tạo câu hỏi mới
export async function createQuestionService(teacherId: number, data: any, imageFile: File | null) {
  const newMongoId = new ObjectId();
  try {
    // Lưu Postgres (Giữ nguyên)
    const newPgQuestion = await createQuestionDB({ ...data, created_by: teacherId, mongo_id: newMongoId.toString() });

    // 🎯 XỬ LÝ ẢNH (MỚI)
    let mediaArray = [];
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const gridFsId = await uploadFileToMongoGridFS(buffer, `q-${Date.now()}`, imageFile.type);
      mediaArray.push({
        type: 'image',
        file_id: gridFsId,
        url: `/api/files/${gridFsId}` // Link này để Frontend page.tsx của bạn hiển thị
      });
    }

    // Lưu MongoDB
    const db = await getMongoDb();
    const contentToInsert: any = {
      _id: newMongoId,
      pg_question_id: newPgQuestion.question_id,
      question_type: data.question_type,
      text: data.text,
      media: mediaArray.length > 0 ? mediaArray : undefined, // 🎯 NHÉT MẢNG ẢNH VÀO ĐÂY
      created_at: new Date(),
      updated_at: new Date()
    };

    // 2. Tùy loại câu hỏi mà nhét thêm dữ liệu đặc thù (Không nhét null bừa bãi)
    if (data.question_type === 'multiple_choice') {
      contentToInsert.options = data.options;
    } else if (data.question_type === 'true_false') {
      contentToInsert.correct_answer = data.correct_answer;
    } else if (data.question_type === 'essay') {
      contentToInsert.sample_answer = data.sample_answer;
    }

    // 3. Thực hiện Insert
    await db.collection('question_content').insertOne(contentToInsert);

    return JSON.parse(JSON.stringify(newPgQuestion));
  } catch (error: any) {
    console.error("🔥 CHI TIẾT LỖI TỪ DATABASE:", error);
    throw new Error(error.message);
  }
}

export async function deleteQuestionService(questionId: number, teacherId: number) {
  // 1. Xóa trong Postgres và lấy ra cái ID của MongoDB
  const mongoIdStr = await deleteQuestionDB(questionId, teacherId);
  
  if (!mongoIdStr) {
    throw new Error('Không thể xóa. Câu hỏi không tồn tại hoặc bạn không có quyền!');
  }

  // 2. Dọn rác bên MongoDB
  try {
    const db = await getMongoDb();
    const mongoId = new ObjectId(mongoIdStr);
    
    // 🎯 2.1 Lấy nội dung câu hỏi ra để KIỂM TRA XEM CÓ FILE/ẢNH KHÔNG
    const questionContent = await db.collection('question_content').findOne({ _id: mongoId });
    
    if (questionContent) {
      // 🎯 2.2 XÓA CÁC FILE ĐÍNH KÈM (GridFS)
      // Giả sử sau này bạn lưu ảnh vào mảng media: [{ type: 'image', file_id: '123...' }]
      if (questionContent.media && questionContent.media.length > 0) {
        const bucket = new GridFSBucket(db, { bucketName: 'course_files' });
        
        for (const item of questionContent.media) {
          if (item.file_id) {
            try {
              // Xóa từng file ảnh/video trong GridFS
              await bucket.delete(new ObjectId(item.file_id));
              console.log(`🗑️ Đã xóa file đính kèm: ${item.file_id}`);
            } catch (err) {
              console.log(`⚠️ Không thể xóa file đính kèm (có thể đã bị xóa trước đó)`);
            }
          }
        }
      }

      // 🎯 2.3 KẾT LIỄU BẢN GHI TRONG MONGODB
      await db.collection('question_content').deleteOne({ _id: mongoId });
      console.log(`🗑️ Đã dọn sạch câu hỏi khỏi MongoDB: ${mongoIdStr}`);
    }
    
    return true;
  } catch (error: any) {
    console.error('🔥 Lỗi khi dọn rác MongoDB:', error);
    // Vẫn return true vì Postgres đã xóa thành công (tránh lỗi đứng giao diện)
    return true; 
  }
}

async function uploadFileToMongoGridFS(fileBuffer: Buffer, fileName: string, mimeType: string) {
  const db = await getMongoDb();
  const bucket = new GridFSBucket(db, { bucketName: 'course_files' });
  return new Promise<string>((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(fileName, { metadata: { contentType: mimeType } });
    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream).on('error', reject).on('finish', () => resolve(uploadStream.id.toString()));
  });
}