'use server';

import { cookies } from 'next/headers';
import { pgPool } from '@/lib/db';
import * as xlsx from 'xlsx';
import bcrypt from 'bcryptjs';

const clean = (val: any) => val ? String(val).trim() : null;

export async function addStudentsToClassAction(classId: number, type: 'manual' | 'excel', data: any) {
  const token = (await cookies()).get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    let studentsToProcess: any[] = [];

    if (type === 'manual') {
      studentsToProcess.push({ student_code: data.student_code.toUpperCase(), name: 'Học sinh mới' });
    } else {
      const arrayBuffer = await (data as File).arrayBuffer();
      const workbook = xlsx.read(Buffer.from(arrayBuffer), { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      studentsToProcess = xlsx.utils.sheet_to_json(sheet);
    }

    let successCount = 0;
    for (const row of studentsToProcess) {
      const code = clean(row['MSSV'] || row['student_code']);
      const name = clean(row['HoTen'] || row['name']) || 'Học sinh mới';

      if (!code) continue;

      const defaultPassword = '123456';
      const passHash = await bcrypt.hash(defaultPassword, 10);

      const studentRes = await client.query(`
        INSERT INTO student (student_code, name, password_hash)
        VALUES ($1, $2, $3)
        ON CONFLICT (student_code) 
        DO UPDATE SET name = EXCLUDED.name
        RETURNING student_id
      `, [code, name, passHash]);

      const studentId = studentRes.rows[0].student_id;

      const enrollRes = await client.query(`
        INSERT INTO enrollment (student_id, class_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [studentId, classId]);

      if (enrollRes.rowCount && enrollRes.rowCount > 0) {
        successCount++;
      }
    }

    await client.query('COMMIT');
    return { success: true, message: `🎉 Đã xử lý xong. Thêm mới ${successCount} học sinh vào lớp!` };
  } catch (e: any) {
    await client.query('ROLLBACK');
    return { success: false, message: 'Lỗi: ' + e.message };
  } finally {
    client.release();
  }
}