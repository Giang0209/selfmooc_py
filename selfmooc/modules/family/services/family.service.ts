import { 
  getStudentByCodeDB, 
  checkLinkExistsDB, 
  linkParentAndStudentDB, 
  getChildrenByParentIdDB 
} from '../models/family.model';

export async function linkChildService(parentId: number, studentCode: string, relationship: string) {
  // 1. Tìm xem mã học sinh có tồn tại không
  const student = await getStudentByCodeDB(studentCode);
  if (!student) {
    throw new Error('❌ Không tìm thấy học sinh nào với mã này!');
  }

  // 2. Kiểm tra xem phụ huynh đã nhận bé này chưa
  const isLinked = await checkLinkExistsDB(parentId, student.student_id);
  if (isLinked) {
    throw new Error(`⚠️ Bạn đã kết nối với bé ${student.name} từ trước rồi!`);
  }

  // 3. Thực hiện kết nối
  await linkParentAndStudentDB(parentId, student.student_id, relationship);
  return student;
}

export async function getMyChildrenService(parentId: number) {
  return await getChildrenByParentIdDB(parentId);
}