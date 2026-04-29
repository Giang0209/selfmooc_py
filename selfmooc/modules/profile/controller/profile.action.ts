'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/mail';
import {
  getUserProfileFromDB,
  updateUserProfileInDB,
  getPasswordHashFromDB,
  updatePasswordInDB
} from '../models/profile.model';

// Hàm giải mã JWT (Nên đưa ra file helper/util riêng nếu dùng chung nhiều nơi)
function getUserFromToken(token: string) {
  try {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

// ==========================================
// 1. HÀM LẤY THÔNG TIN CÁ NHÂN
// ==========================================
export async function getProfileAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user) return { success: false, message: 'Token không hợp lệ' };

  try {
    const profileData = await getUserProfileFromDB(user.id, user.role);
    if (!profileData) return { success: false, message: 'Không tìm thấy hồ sơ' };

    return { success: true, data: profileData, role: user.role };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Lỗi khi lấy thông tin' };
  }
}

// ==========================================
// 2. HÀM CẬP NHẬT THÔNG TIN
// ==========================================
export async function updateProfileAction(formData: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user) return { success: false, message: 'Token không hợp lệ' };

  // Xác thực dữ liệu bằng Zod
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
  const dobValue = dob ? dob : null;

  try {
    // Gọi Model xử lý DB
    await updateUserProfileInDB(user.id, user.role, { name, phone, dobValue });
    return { success: true, message: '🎉 Cập nhật hồ sơ siêu tốc thành công! 🚀' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Lỗi cập nhật DB' };
  }
}



// ==========================================
// 4. HÀM ĐỔI MẬT KHẨU
// ==========================================
export async function changePasswordAction(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user) return { success: false, message: 'Token không hợp lệ' };

  const oldPassword = formData.get('old_password') as string;
  const newPassword = formData.get('new_password') as string;
  const confirmPassword = formData.get('confirm_new_password') as string;


  if (!oldPassword) return { success: false, message: 'Vui lòng nhập mật khẩu cũ' };
  if (!newPassword || newPassword.length < 6)
    return { success: false, message: 'Mật khẩu mới phải ≥ 6 ký tự' };
  if (newPassword !== confirmPassword)
    return { success: false, message: 'Mật khẩu xác nhận không khớp' };
  if (oldPassword === newPassword)
    return { success: false, message: 'Mật khẩu mới phải khác mật khẩu cũ' };

  try {
    // 1. Lấy hash cũ
    const currentHash = await getPasswordHashFromDB(user.id, user.role);
    if (!currentHash) return { success: false, message: 'Không tìm thấy người dùng' };

    // 2. So sánh mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, currentHash);
    if (!isMatch)
      return { success: false, message: '❌ Mật khẩu cũ không chính xác!' };

    // 3. Hash mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update DB
    await updatePasswordInDB(user.id, user.role, hashedNewPassword);

    return { success: true, message: '🎉 Đổi mật khẩu thành công!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Lỗi hệ thống khi đổi mật khẩu' };
  }
}