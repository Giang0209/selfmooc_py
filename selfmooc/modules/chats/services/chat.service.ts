

import { 
  getParentsByClassDB, 
  getOrCreateConversationDB 
} from '../models/chat.model';
import { getMongoDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { pgPool } from '@/lib/db';
/**
 * Lấy danh sách phụ huynh trong lớp kèm thông tin con cái
 */
export async function getClassParentsService(classId: number) {
  const parents = await getParentsByClassDB(classId);
  // Bạn có thể thêm logic format tên hoặc lọc dữ liệu ở đây nếu cần
  return parents;
}

// 1. Dành cho Giảng viên: Lấy danh sách Phụ huynh của các sinh viên trong lớp mình dạy
export async function getTeacherListForParentService(parentId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT DISTINCT 
        t.teacher_id AS contact_id, -- Sửa từ t.id thành t.teacher_id
        t.name AS contact_name, 
        c.name AS sub_info -- Tên lớp hoặc môn học
      FROM parent p
      JOIN parent_student ps ON p.parent_id = ps.parent_id -- Sửa p.id thành p.parent_id
      JOIN student s ON ps.student_id = s.student_id -- s.id thành s.student_id
      JOIN enrollment e ON s.student_id = e.student_id
      JOIN class c ON e.class_id = c.class_id -- c.id thành c.class_id
      JOIN teacher t ON c.teacher_id = t.teacher_id -- t.id thành t.teacher_id
      WHERE p.parent_id = $1; -- Sửa p.id thành p.parent_id
    `;
    const res = await client.query(query, [parentId]);
    return res.rows;
  } finally {
    client.release();
  }
}
export async function getTeacherChatListService(tId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT 
        p.parent_id AS contact_id, -- Sửa p.id thành p.parent_id
        p.name AS contact_name, 
        STRING_AGG(s.name, ', ') AS sub_info -- Gộp tên các con: "Con A, Con B"
      FROM teacher t
      JOIN class c ON t.teacher_id = c.teacher_id
      JOIN enrollment e ON c.class_id = e.class_id
      JOIN student s ON e.student_id = s.student_id
      JOIN parent_student ps ON s.student_id = ps.student_id
      JOIN parent p ON ps.parent_id = p.parent_id
      WHERE t.teacher_id = $1
      GROUP BY p.parent_id, p.name; -- 🎯 BẮT BUỘC có GROUP BY để không trùng ID
    `;
    const res = await client.query(query, [tId]);
    return res.rows;
  } finally {
    client.release();
  }
}

// 2. Dành cho Phụ huynh: Lấy danh sách Giảng viên đang dạy con mình
export async function getParentChatListService(parentId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT 
        t.teacher_id AS contact_id,
        t.name AS contact_name,
        STRING_AGG(DISTINCT c.name, ', ') AS sub_info
      FROM parent_student ps
      JOIN student s ON ps.student_id = s.student_id
      JOIN enrollment e ON s.student_id = e.student_id
      JOIN class c ON e.class_id = c.class_id
      JOIN teacher t ON c.teacher_id = t.teacher_id
      WHERE ps.parent_id = $1
      GROUP BY t.teacher_id, t.name;
    `;
    const result = await client.query(query, [parentId]);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * 1. Lấy hoặc Tạo cuộc hội thoại (Conversation)
 */
export async function startConversationService(tId: number, pId: number, sId: number) {
  const db = await getMongoDb();
  // Đảm bảo dùng đúng tên trường pg_... như trong NoSql.js
  const filter = { 
    pg_teacher_id: Number(tId), 
    pg_parent_id: Number(pId), 
    pg_student_id: Number(sId) 
  };

  let conversation = await db.collection('parent_teacher_conversations').findOne(filter);

  if (!conversation) {
    const res = await db.collection('parent_teacher_conversations').insertOne({
      ...filter,
      last_message: "",
      updated_at: new Date()
    });
    return res.insertedId.toString();
  }

  return conversation._id.toString();
}

/**
 * 2. Lấy lịch sử tin nhắn
 */
export async function getMessageHistoryService(conversationId: string) {
  const db = await getMongoDb();
  const messages = await db.collection('parent_teacher_messages')
    .find({ conversation_id: new ObjectId(conversationId) })
    .sort({ created_at: 1 })
    .toArray();

  return messages.map(msg => ({
    ...msg,
    _id: msg._id.toString(),
    conversation_id: msg.conversation_id.toString(),
    created_at: msg.created_at.toISOString()
  }));
}

/**
 * 3. Gửi tin nhắn (Sửa lỗi ép kiểu int cho Postgres ID)
 */
export async function sendChatMessageService(data: {
  tId: number, pId: number, sId: number, content: string, senderRole: 'teacher' | 'parent'
}) {
  const db = await getMongoDb();
  
  // Lấy ID hội thoại
  const convIdStr = await startConversationService(data.tId, data.pId, data.sId);
  const convId = new ObjectId(convIdStr);

  const senderId = data.senderRole === 'teacher' ? data.tId : data.pId;
  
  const newMessage = {
    conversation_id: convId, // Phải là ObjectId
    sender_id: Number(senderId), // Ép về int để khớp Schema
    sender_role: data.senderRole,
    content: data.content.trim(),
    created_at: new Date()
  };

  // Lưu tin nhắn vào Mongo
  const result = await db.collection('parent_teacher_messages').insertOne(newMessage);
  
  // Cập nhật tin nhắn cuối cùng
  await db.collection('parent_teacher_conversations').updateOne(
    { _id: convId },
    { $set: { last_message: data.content.trim(), updated_at: new Date() } }
  );

  return { ...newMessage, _id: result.insertedId.toString(), conversation_id: convIdStr };
}