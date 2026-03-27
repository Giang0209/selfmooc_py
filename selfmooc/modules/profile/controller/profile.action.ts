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
// 3. GỬI OTP ĐỔI MẬT KHẨU
// ==========================================
export async function requestOtpAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user || user.role === 'student') return { success: false, message: 'Không hợp lệ' };

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await sendOtpEmail(user.email, otpCode);
    
    cookieStore.set('reset_otp', otpCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 5 * 60, 
      path: '/',
    });

    return { success: true, message: '📩 Đã gửi mã OTP. Vui lòng kiểm tra Hòm thư (hoặc Spam) nhé!' };
  } catch (error) {
    console.error('LỖI GỬI MAIL:', error);
    return { success: false, message: '❌ Lỗi hệ thống: Không thể gửi email lúc này.' };
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
  const otpCodeInput = formData.get('otp_code') as string;

  if (!oldPassword) return { success: false, message: 'Vui lòng nhập mật khẩu cũ' };
  if (!newPassword || newPassword.length < 6) return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
  if (newPassword !== confirmPassword) return { success: false, message: 'Mật khẩu xác nhận không khớp nha!' };

  if (user.role === 'teacher' || user.role === 'parent') {
    const savedOtp = cookieStore.get('reset_otp')?.value;
    if (!savedOtp) return { success: false, message: 'Mã OTP đã hết hạn hoặc chưa được gửi' };
    if (savedOtp !== otpCodeInput) return { success: false, message: '❌ Mã OTP không chính xác' };
  }

  try {
    // 1. Gọi Model lấy Hash cũ
    const currentHash = await getPasswordHashFromDB(user.id, user.role);
    if (!currentHash) return { success: false, message: 'Không tìm thấy người dùng' };

    // 2. So sánh mật khẩu
    const isMatch = await bcrypt.compare(oldPassword, currentHash);
    if (!isMatch) return { success: false, message: '❌ Mật khẩu cũ không chính xác!' };

    // 3. Gọi Model cập nhật Hash mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await updatePasswordInDB(user.id, user.role, hashedNewPassword);

    if (user.role === 'teacher' || user.role === 'parent') {
      cookieStore.delete('reset_otp');
    }

    return { success: true, message: '🎉 Đổi mật khẩu thành công rực rỡ!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Lỗi hệ thống khi lưu mật khẩu' };
  }
}