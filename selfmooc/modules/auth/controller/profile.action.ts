'use server';

import { cookies } from 'next/headers';
import { pgPool } from '@/lib/db'; // Nhớ kiểm tra lại đường dẫn file kết nối DB của bạn
import { z } from 'zod';

// Hàm giải mã JWT (Dùng tạm cách này để lấy ID và Role)
function getUserFromToken(token: string) {
  try {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

// 1. HÀM LẤY THÔNG TIN CÁ NHÂN
export async function getProfileAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user) return { success: false, message: 'Token không hợp lệ' };

  const client = await pgPool.connect();
  try {
    let query = '';
    // Tùy theo role mà chui vào đúng bảng để lấy dữ liệu
    if (user.role === 'teacher') {
      query = 'SELECT name, email, phone, dob, avatar_url FROM teacher WHERE teacher_id = $1';
    } else if (user.role === 'student') {
      query = 'SELECT name, email, phone, dob, avatar_url, student_code FROM student WHERE student_id = $1';
    } else if (user.role === 'parent') {
      // Parent không có avatar_url trong schema hiện tại
      query = 'SELECT name, email, phone, dob FROM parent WHERE parent_id = $1';
    }

    const result = await client.query(query, [user.id]);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Lỗi khi lấy thông tin' };
  } finally {
    client.release();
  }
}

// 2. HÀM CẬP NHẬT THÔNG TIN
export async function updateProfileAction(formData: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  
  // 1. ĐẶT LÍNH CANH Ở ĐÂY: Kiểm tra token trước!
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  // 2. Lọt qua được lính canh thì TypeScript mới tự tin token là 'string' 100%
  const user = getUserFromToken(token);
  if (!user) return { success: false, message: 'Token không hợp lệ' };

  // Xác thực dữ liệu bằng Zod (Phần dưới giữ nguyên nhé)
  const schema = z.object({
    name: z.string().min(1, 'Tên không được để trống'),
    phone: z.string().optional(),
    dob: z.string().optional(),
  });

  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { name, phone, dob } = parsed.data;
  const dobValue = dob ? dob : null; // Xử lý ngày sinh rỗng

  const client = await pgPool.connect();
  try {
    let query = '';
    if (user.role === 'teacher') {
      query = 'UPDATE teacher SET name = $1, phone = $2, dob = $3, updated_at = NOW() WHERE teacher_id = $4';
    } else if (user.role === 'student') {
      query = 'UPDATE student SET name = $1, phone = $2, dob = $3, updated_at = NOW() WHERE student_id = $4';
    } else if (user.role === 'parent') {
      query = 'UPDATE parent SET name = $1, phone = $2, dob = $3 WHERE parent_id = $4'; // Parent chưa có updated_at
    }

    await client.query(query, [name, phone, dobValue, user.id]);
    return { success: true, message: 'Cập nhật hồ sơ siêu tốc thành công! 🚀' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Lỗi cập nhật DB' };
  } finally {
    client.release();
  }
}