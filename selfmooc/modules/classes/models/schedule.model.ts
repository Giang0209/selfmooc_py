import { pgPool } from '@/lib/db';

// 1. Thêm lịch học vào DB
export async function insertClassScheduleDB(classId: number, dayOfWeek: number, startTime: string, endTime: string, room: string) {
  const client = await pgPool.connect();
  try {
    await client.query(`
      INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time, room)
      VALUES ($1, $2, $3, $4, $5)
    `, [classId, dayOfWeek, startTime, endTime, room]);
  } finally {
    client.release();
  }
}

// 2. Xóa lịch học
export async function deleteClassScheduleDB(scheduleId: number) {
  const client = await pgPool.connect();
  try {
    await client.query('DELETE FROM class_schedule WHERE schedule_id = $1', [scheduleId]);
  } finally {
    client.release();
  }
}

// 3. Lấy lịch học của 1 lớp
export async function getClassScheduleByClassIdDB(classId: number) {
  const client = await pgPool.connect();
  try {
    const res = await client.query('SELECT * FROM class_schedule WHERE class_id = $1 ORDER BY day_of_week ASC, start_time ASC', [classId]);
    return res.rows;
  } finally {
    client.release();
  }
}

// ==========================================
// CÁC HÀM LẤY THỜI KHÓA BIỂU THEO ROLE
// ==========================================
const baseSelectSchedule = `
  SELECT cs.schedule_id, cs.day_of_week, cs.start_time, cs.end_time, cs.room, 
         cl.name AS class_name, cr.name AS course_name, cr.theme_color
  FROM class_schedule cs
  JOIN class cl ON cs.class_id = cl.class_id
  JOIN course cr ON cl.course_id = cr.course_id
`;

export async function getTeacherWeeklyScheduleDB(teacherId: number) {
  const client = await pgPool.connect();
  try {
    const query = `${baseSelectSchedule} WHERE cl.teacher_id = $1 ORDER BY cs.day_of_week ASC, cs.start_time ASC`;
    const res = await client.query(query, [teacherId]);
    return res.rows;
  } finally {
    client.release();
  }
}

export async function getStudentWeeklyScheduleDB(studentId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      ${baseSelectSchedule}
      JOIN enrollment e ON cl.class_id = e.class_id
      WHERE e.student_id = $1 AND e.status = 'active'
      ORDER BY cs.day_of_week ASC, cs.start_time ASC
    `;
    const res = await client.query(query, [studentId]);
    return res.rows;
  } finally {
    client.release();
  }
}

export async function getParentWeeklyScheduleDB(parentId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      ${baseSelectSchedule}
      JOIN enrollment e ON cl.class_id = e.class_id
      JOIN parent_student ps ON e.student_id = ps.student_id
      WHERE ps.parent_id = $1 AND e.status = 'active'
      ORDER BY cs.day_of_week ASC, cs.start_time ASC
    `;
    const res = await client.query(query, [parentId]);
    return res.rows;
  } finally {
    client.release();
  }
}