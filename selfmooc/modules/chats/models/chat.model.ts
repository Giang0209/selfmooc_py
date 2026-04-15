import { pgPool } from '@/lib/db';
import { getMongoDb } from '@/lib/db';
import { ObjectId } from 'mongodb';

// 1. Tìm phụ huynh của các sinh viên trong một lớp (Dùng cho giảng viên)
export async function getParentsByClassDB(classId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT p.parent_id, p.name as parent_name, s.name as student_name, s.student_id
      FROM parent p
      JOIN parent_student ps ON p.parent_id = ps.parent_id
      JOIN student s ON s.student_id = ps.student_id
      JOIN enrollment e ON s.student_id = e.student_id
      WHERE e.class_id = $1 AND s.is_active = TRUE
    `;
    const res = await client.query(query, [classId]);
    return res.rows;
  } finally { client.release(); }
}

// 2. Lấy hoặc tạo mới cuộc hội thoại trong MongoDB
export async function getOrCreateConversationDB(tId: number, pId: number, sId: number) {
  const db = await getMongoDb();
  const filter = { 
    pg_teacher_id: Number(tId), 
    pg_parent_id: Number(pId), 
    pg_student_id: Number(sId) 
  };

  let conv = await db.collection('parent_teacher_conversations').findOne(filter);
  
  if (!conv) {
    const result = await db.collection('parent_teacher_conversations').insertOne({
      ...filter,
      last_message: "",
      updated_at: new Date()
    });
    return result.insertedId.toString();
  }
  return conv._id.toString();
}