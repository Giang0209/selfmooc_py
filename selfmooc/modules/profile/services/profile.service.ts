import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/mail';
import { 
  getUserProfileFromDB, 
  updateUserProfileInDB, 
  getPasswordHashFromDB, 
  updatePasswordInDB 
} from '../models/profile.model';

export async function getProfileService(userId: string, role: string) {
  const profileData = await getUserProfileFromDB(userId, role);
  if (!profileData) throw new Error('Không tìm thấy hồ sơ');
  return profileData;
}

export async function updateProfileService(userId: string, role: string, data: { name: string, phone?: string, dobValue?: string | null }) {
  await updateUserProfileInDB(userId, role, data);
}

export async function sendOtpService(email: string) {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  await sendOtpEmail(email, otpCode);
  return otpCode;
}

export async function changePasswordService(userId: string, role: string, oldPass: string, newPass: string) {
  // 1. Lấy Hash cũ
  const currentHash = await getPasswordHashFromDB(userId, role);
  if (!currentHash) throw new Error('Không tìm thấy người dùng');

  // 2. So sánh mật khẩu
  const isMatch = await bcrypt.compare(oldPass, currentHash);
  if (!isMatch) throw new Error('❌ Mật khẩu cũ không chính xác!');

  // 3. Băm pass mới và lưu
  const hashedNewPassword = await bcrypt.hash(newPass, 10);
  await updatePasswordInDB(userId, role, hashedNewPassword);
}