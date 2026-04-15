'use server';
import { cookies } from 'next/headers';
import { getMongoDb } from '@/lib/db';

export async function getMyNotificationsAction() {
  const token = (await cookies()).get('session')?.value;
  if (!token) return { success: false, data: [] };
  const user = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));

  const db = await getMongoDb();
  // Lấy 10 thông báo mới nhất
  const notifs = await db.collection('notification')
    .find({ recipient_id: user.id })
    .sort({ created_at: -1 })
    .limit(10)
    .toArray();
    
  return { success: true, data: notifs.map(n => ({...n, _id: n._id.toString()})) };
}

export async function markAsReadAction(notifId: string) {
  const db = await getMongoDb();
  await db.collection('notification').updateOne({ _id: new Object(notifId) }, { $set: { is_read: true } });
  return { success: true };
}