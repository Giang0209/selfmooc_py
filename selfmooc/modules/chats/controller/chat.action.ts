'use server'
import { pgPool } from '@/lib/db';
import { sendChatMessageService, getMessageHistoryService, startConversationService } from '../services/chat.service';

export async function getChatDetailsAction(tId: number, pId: number, sId: number, userRole: 'teacher' | 'parent') {
  try {
    const convId = await startConversationService(tId, pId, sId);
    const history = await getMessageHistoryService(convId);

    // 🔥 LẤY INFO NGƯỜI ĐỐI DIỆN
    const client = await pgPool.connect();
    let contactInfo = null;

    try {
      const isTeacher = userRole === 'teacher';

      const query = isTeacher
        ? `SELECT parent_id as id, name, 'parent' as role FROM parent WHERE parent_id = $1`
        : `SELECT teacher_id as id, name, 'teacher' as role FROM teacher WHERE teacher_id = $1`;

      const id = isTeacher ? pId : tId;

      const res = await client.query(query, [id]);

      contactInfo = res.rows[0] || null;

    } finally {
      client.release();
    }

    return {
      success: true,
      convId,
      history,
      contactInfo, // 👈 THÊM CÁI NÀY
    };

  } catch (e: any) {
    console.error("Action Error (GetDetails):", e.message);
    return { success: false, error: e.message };
  }
}

export async function sendMessageAction(data: any) {
  try {
    const res = await sendChatMessageService(data);
    return { success: true, message: res };
  } catch (e: any) {
    console.error("Action Error (Send):", e.message);
    return { success: false, error: e.message };
  }
}