'use server';
import { cookies } from 'next/headers';
import { getMongoDb } from '@/lib/db';
import { ObjectId } from 'mongodb'; 

export async function getMyNotificationsAction() {
  const token = (await cookies()).get('session')?.value;
  if (!token) return { success: false, data: [] };
  
  // Giải mã token để lấy user id
  const user = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));

  const db = await getMongoDb();
  const notifs = await db.collection('notification')
    .find({ recipient_id: user.id })
    .sort({ created_at: -1 })
    .limit(10)
    .toArray();
    
  return { 
    success: true, 
    data: notifs.map(n => ({...n, _id: n._id.toString()})) 
  };
}

export async function markAsReadAction(notifId: string) {
  try {
    const db = await getMongoDb();
    
    const result = await db.collection('notification').updateOne(
      { _id: new ObjectId(notifId) }, 
      { $set: { is_read: true } }
    );

    if (result.matchedCount > 0) {
      return { success: true };
    }
    return { success: false, message: "Không tìm thấy thông báo" };
  } catch (error) {
    console.error("Lỗi cập nhật thông báo:", error);
    return { success: false };
  }
}