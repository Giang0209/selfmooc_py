import { pgPool } from '@/lib/db';

// Lấy thông tin User
export async function getUserProfileFromDB(userId: string, role: string) {
  const client = await pgPool.connect();
  try {
    let query = '';
    if (role === 'teacher') query = 'SELECT name, email, phone, dob, avatar_url FROM teacher WHERE teacher_id = $1';
    else if (role === 'parent') query = 'SELECT name, email, phone, dob FROM parent WHERE parent_id = $1';
    else if (role === 'student') query = 'SELECT name, dob, avatar_url, student_code FROM student WHERE student_id = $1';

    const result = await client.query(query, [userId]);
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Cập nhật thông tin User
export async function updateUserProfileInDB(userId: string, role: string, data: { name: string, phone?: string, dobValue?: string | null }) {
  const client = await pgPool.connect();
  try {
    const { name, phone, dobValue } = data;
    let query = '';
    
    if (role === 'teacher') {
      query = 'UPDATE teacher SET name = $1, phone = $2, dob = $3, updated_at = NOW() WHERE teacher_id = $4';
      await client.query(query, [name, phone, dobValue, userId]);
    } else if (role === 'parent') {
      query = 'UPDATE parent SET name = $1, phone = $2, dob = $3 WHERE parent_id = $4';
      await client.query(query, [name, phone, dobValue, userId]);
    } else if (role === 'student') {
      query = 'UPDATE student SET name = $1, dob = $2, updated_at = NOW() WHERE student_id = $3';
      await client.query(query, [name, dobValue, userId]);
    }
  } finally {
    client.release();
  }
}

// Lấy mật khẩu cũ (Hash) để kiểm tra
export async function getPasswordHashFromDB(userId: string, role: string) {
  const client = await pgPool.connect();
  try {
    let query = '';
    if (role === 'student') query = 'SELECT password_hash FROM student WHERE student_id = $1';
    else if (role === 'teacher') query = 'SELECT password_hash FROM teacher WHERE teacher_id = $1';
    else if (role === 'parent') query = 'SELECT password_hash FROM parent WHERE parent_id = $1';

    const result = await client.query(query, [userId]);
    return result.rows.length > 0 ? result.rows[0].password_hash : null;
  } finally {
    client.release();
  }
}

// Cập nhật mật khẩu mới
export async function updatePasswordInDB(userId: string, role: string, newHash: string) {
  const client = await pgPool.connect();
  try {
    let query = '';
    if (role === 'student') query = 'UPDATE student SET password_hash = $1, updated_at = NOW() WHERE student_id = $2';
    else if (role === 'teacher') query = 'UPDATE teacher SET password_hash = $1, updated_at = NOW() WHERE teacher_id = $2';
    else if (role === 'parent') query = 'UPDATE parent SET password_hash = $1 WHERE parent_id = $2';
    
    await client.query(query, [newHash, userId]);
  } finally {
    client.release();
  }
}