import {
  insertClassScheduleDB,
  deleteClassScheduleDB,
  getClassScheduleByClassIdDB,
  getTeacherWeeklyScheduleDB,
  getStudentWeeklyScheduleDB,
  getParentWeeklyScheduleDB, 
  updateClassScheduleDB
} from '../models/schedule.model';

export async function addClassScheduleService(classId: number, dayOfWeek: number, startTime: string, endTime: string, room: string) {
  try {
    await insertClassScheduleDB(classId, dayOfWeek, startTime, endTime, room);
    return true;
  } catch (error: any) {
    // Bắt lỗi UNIQUE CONSTRAINT từ database (trùng ngày, trùng giờ học)
    if (error.code === '23505') {
      throw new Error('⚠️ Lịch này bị trùng giờ và ngày rồi!');
    }
    throw new Error('Lỗi hệ thống khi thêm lịch học.');
  }
}

export async function deleteClassScheduleService(scheduleId: number) {
  try {
    await deleteClassScheduleDB(scheduleId);
    return true;
  } catch (error) {
    throw new Error('Lỗi khi xóa lịch học.');
  }
}

export async function getClassScheduleService(classId: number) {
  return await getClassScheduleByClassIdDB(classId);
}

export async function getMyWeeklyScheduleService(userId: number, role: string) {
  // Logic rẽ nhánh tự động gọi đúng Model tùy thuộc vào người đang xem là ai
  if (role === 'teacher') {
    return await getTeacherWeeklyScheduleDB(userId);
  } else if (role === 'student') {
    return await getStudentWeeklyScheduleDB(userId);
  } else if (role === 'parent') {
    return await getParentWeeklyScheduleDB(userId);
  }
  return [];
}

export async function updateClassScheduleService(scheduleId: number, dayOfWeek: number, startTime: string, endTime: string, room: string) {
  try {
    await updateClassScheduleDB(scheduleId, dayOfWeek, startTime, endTime, room);
    return true;
  } catch (error: any) {
    if (error.code === '23505') throw new Error('⚠️ Lịch này bị trùng giờ và ngày rồi!');
    throw new Error('Lỗi hệ thống khi cập nhật lịch học.');
  }
}