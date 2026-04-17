'use server';

import { cookies } from 'next/headers';
import {
  addClassScheduleService,
  deleteClassScheduleService,
  getClassScheduleService,
  getMyWeeklyScheduleService,
  updateClassScheduleService
} from '../services/schedule.service';

function getUserFromToken(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
  } catch (error) { return null; }
}

export async function addClassScheduleAction(classId: number, formData: FormData) {
  const token = (await cookies()).get('session')?.value;
  const user = token ? getUserFromToken(token) : null;
  
  // Phân quyền: Chỉ Giáo viên mới được xếp lịch
  if (!user || user.role !== 'teacher') return { success: false, message: 'Không có quyền' };

  const dayOfWeek = Number(formData.get('day_of_week'));
  const startTime = formData.get('start_time') as string;
  const endTime = formData.get('end_time') as string;
  const room = formData.get('room') as string;

  try {
    await addClassScheduleService(classId, dayOfWeek, startTime, endTime, room);
    return { success: true, message: '✅ Đã thêm lịch học thành công!' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteClassScheduleAction(scheduleId: number) {
  const token = (await cookies()).get('session')?.value;
  const user = token ? getUserFromToken(token) : null;
  
  if (!user || user.role !== 'teacher') return { success: false, message: 'Không có quyền' };

  try {
    await deleteClassScheduleService(scheduleId);
    return { success: true, message: '🗑️ Đã xóa lịch học!' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getClassScheduleAction(classId: number) {
  try {
    const data = await getClassScheduleService(classId);
    return { success: true, data };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function getMyWeeklyScheduleAction() {
  const token = (await cookies()).get('session')?.value;
  const user = token ? getUserFromToken(token) : null;
  
  if (!user) return { success: false, data: [] };

  try {
    const data = await getMyWeeklyScheduleService(user.id, user.role);
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, data: [] };
  }
}

export async function updateClassScheduleAction(scheduleId: number, formData: FormData) {
  const token = (await cookies()).get('session')?.value;
  const user = token ? getUserFromToken(token) : null;
  if (!user || user.role !== 'teacher') return { success: false, message: 'Không có quyền' };

  const dayOfWeek = Number(formData.get('day_of_week'));
  const startTime = formData.get('start_time') as string;
  const endTime = formData.get('end_time') as string;
  const room = formData.get('room') as string;

  try {
    await updateClassScheduleService(scheduleId, dayOfWeek, startTime, endTime, room);
    return { success: true, message: '✅ Đã cập nhật lịch học thành công!' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}