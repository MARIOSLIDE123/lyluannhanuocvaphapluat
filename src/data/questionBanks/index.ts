import { StructuredQuestion } from './types';
import { questionBankChuong1Bo1 } from './chuong1Bo1';
import { questionBankChuong1Bo2 } from './chuong1Bo2';
import { questionBankChuong2Bo1 } from './chuong2Bo1';
import { questionBankChuong2Bo2 } from './chuong2Bo2';
import { questionBankChuong3QuyPhamPhapLuat } from './chuong3QuyPhamPhapLuat';
import { questionBankChuong3QuanHePhapLuat } from './chuong3QuanHePhapLuat';
import { questionBankChuong4ThucHienPhapLuat } from './chuong4ThucHienPhapLuat';
import { questionBankChuong4ViPhamPhapLuat } from './chuong4ViPhamPhapLuat';
import { questionBankChuong5LuatHienPhap } from './chuong5LuatHienPhap';
import { QuizItem, QuizQuestion } from '../../types';

export * from './types';
export { questionBankChuong1Bo1 } from './chuong1Bo1';
export { questionBankChuong1Bo2 } from './chuong1Bo2';
export { questionBankChuong2Bo1 } from './chuong2Bo1';
export { questionBankChuong2Bo2 } from './chuong2Bo2';
export { questionBankChuong3QuyPhamPhapLuat } from './chuong3QuyPhamPhapLuat';
export { questionBankChuong3QuanHePhapLuat } from './chuong3QuanHePhapLuat';
export { questionBankChuong4ThucHienPhapLuat } from './chuong4ThucHienPhapLuat';
export { questionBankChuong4ViPhamPhapLuat } from './chuong4ViPhamPhapLuat';
export { questionBankChuong5LuatHienPhap } from './chuong5LuatHienPhap';

export const allStructuredQuestionBanks: Record<string, StructuredQuestion[]> = {
  chuong1_bo1: questionBankChuong1Bo1,
  chuong1_bo2: questionBankChuong1Bo2,
  chuong2_bo1: questionBankChuong2Bo1,
  chuong2_bo2: questionBankChuong2Bo2,
  chuong3_quy_pham_phap_luat: questionBankChuong3QuyPhamPhapLuat,
  chuong3_quan_he_phap_luat: questionBankChuong3QuanHePhapLuat,
  chuong4_thuc_hien_phap_luat: questionBankChuong4ThucHienPhapLuat,
  chuong4_vi_pham_phap_luat: questionBankChuong4ViPhamPhapLuat,
  chuong5_luat_hien_phap: questionBankChuong5LuatHienPhap,
};

function optionIdToIndex(optId: string): number {
  const code = optId.toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 90) return code - 65;
  return 0;
}

export function convertToQuizQuestion(
  sq: StructuredQuestion,
  quizId: string,
  order: number,
  topic: string = 'Lý luận chung'
): QuizQuestion {
  return {
    id: sq.id,
    quizId: quizId,
    content: sq.questionText,
    options: sq.options.map(o => o.text),
    correctAnswer: optionIdToIndex(sq.correctOptionId),
    questionType: 'single',
    points: sq.points || 1,
    explanation: sq.explanation,
    topic: topic,
    difficulty: 'Thông hiểu',
    order: order,
  };
}

export const OFFICIAL_QUIZ_SETS: QuizItem[] = [
  {
    id: 'quiz-chuong1-bo1',
    title: 'CHƯƠNG 1 – BỘ CÂU HỎI 1: NHÀ NƯỚC VÀ NHỮNG VẤN ĐỀ LÝ LUẬN CƠ BẢN',
    chapter: 'Chương 1: Nguồn gốc và bản chất Nhà nước',
    instructions: 'Trích xuất từ tài liệu Chương 1...pdf. Bao gồm 20 câu hỏi trắc nghiệm chuyên sâu về nguồn gốc, bản chất, chủ quyền và chức năng của nhà nước.',
    durationMinutes: 20,
    maxAttempts: 0, // Không giới hạn lượt ôn tập
    viewScoreMode: 'immediate',
    viewAnswersMode: 'after_submit',
    targetClasses: ['Tất cả'],
    status: 'published',
    passingScore: 5.0,
    isSample: false, // Dữ liệu chính thức, không phải dữ liệu mẫu
    createdAt: '2024-10-27T08:00:00.000Z',
    createdBy: 'ThS. Ngô Thị Mai Anh - Khoa Luật',
  },
  {
    id: 'quiz-chuong1-bo2',
    title: 'CHƯƠNG 1 – BỘ CÂU HỎI 2: NHÀ NƯỚC',
    chapter: 'Chương 1: Nguồn gốc và bản chất Nhà nước',
    instructions: 'Trích xuất từ tài liệu Chương 1.pdf. Bao gồm 20 câu hỏi trắc nghiệm về hình thái kinh tế - xã hội, kiểu nhà nước, hình thức chính thể và bộ máy nhà nước.',
    durationMinutes: 20,
    maxAttempts: 0,
    viewScoreMode: 'immediate',
    viewAnswersMode: 'after_submit',
    targetClasses: ['Tất cả'],
    status: 'published',
    passingScore: 5.0,
    isSample: false,
    createdAt: '2024-10-27T08:00:00.000Z',
    createdBy: 'ThS. Ngô Thị Mai Anh - Khoa Luật',
  },
  {
    id: 'quiz-chuong2-bo1',
    title: 'CHƯƠNG 2 – BỘ CÂU HỎI 1: NGUỒN CỦA PHÁP LUẬT',
    chapter: 'Chương 2: Pháp luật trong hệ thống điều chỉnh xã hội',
    instructions: 'Trích xuất từ tài liệu Chương 2..pdf. Bao gồm 20 câu hỏi trắc nghiệm về nguồn pháp luật, tập quán pháp, tiền lệ pháp và văn bản quy phạm pháp luật.',
    durationMinutes: 20,
    maxAttempts: 0,
    viewScoreMode: 'immediate',
    viewAnswersMode: 'after_submit',
    targetClasses: ['Tất cả'],
    status: 'published',
    passingScore: 5.0,
    isSample: false,
    createdAt: '2024-10-27T08:00:00.000Z',
    createdBy: 'ThS. Ngô Thị Mai Anh - Khoa Luật',
  },
  {
    id: 'quiz-chuong2-bo2',
    title: 'CHƯƠNG 2 – BỘ CÂU HỎI 2: PHÁP LUẬT',
    chapter: 'Chương 2: Pháp luật trong đời sống xã hội',
    instructions: 'Trích xuất từ tài liệu Chương 2.pdf. Bao gồm 20 câu hỏi trắc nghiệm chuyên sâu về các kiểu pháp luật, bản chất, thuộc tính, chức năng và mối quan hệ giữa pháp luật với kinh tế, chính trị, đạo đức.',
    durationMinutes: 20,
    maxAttempts: 0,
    viewScoreMode: 'immediate',
    viewAnswersMode: 'after_submit',
    targetClasses: ['Tất cả'],
    status: 'published',
    passingScore: 5.0,
    isSample: false,
    createdAt: '2024-10-27T10:00:00.000Z',
    createdBy: 'ThS. Ngô Thị Mai Anh - Khoa Luật',
  },
  {
    id: 'quiz-chuong3-qppl',
    title: 'CHƯƠNG 3 – QUY PHẠM PHÁP LUẬT',
    chapter: 'Chương 3: Quy phạm pháp luật',
    instructions: 'Trích xuất từ tài liệu Chương 3. Quy phạm pháp luật.pdf. Bao gồm 20 câu hỏi trắc nghiệm về cấu trúc quy phạm pháp luật (giả định, quy định, chế tài), phân loại và kỹ thuật trình bày điều luật.',
    durationMinutes: 20,
    maxAttempts: 0,
    viewScoreMode: 'immediate',
    viewAnswersMode: 'after_submit',
    targetClasses: ['Tất cả'],
    status: 'published',
    passingScore: 5.0,
    isSample: false,
    createdAt: '2024-10-27T10:00:00.000Z',
    createdBy: 'ThS. Ngô Thị Mai Anh - Khoa Luật',
  },
  {
    id: 'quiz-chuong3-qhpl',
    title: 'CHƯƠNG 3 – QUAN HỆ PHÁP LUẬT',
    chapter: 'Chương 3: Quan hệ pháp luật',
    instructions: 'Trích xuất từ tài liệu Chương 3.Quan hệ PL.pdf. Bao gồm 20 câu hỏi trắc nghiệm về khái niệm, đặc điểm quan hệ pháp luật, các yếu tố cấu thành (chủ thể, nội dung, khách thể) và sự kiện pháp lý.',
    durationMinutes: 20,
    maxAttempts: 0,
    viewScoreMode: 'immediate',
    viewAnswersMode: 'after_submit',
    targetClasses: ['Tất cả'],
    status: 'published',
    passingScore: 5.0,
    isSample: false,
    createdAt: '2024-10-27T10:00:00.000Z',
    createdBy: 'ThS. Ngô Thị Mai Anh - Khoa Luật',
  },
  {
    id: 'quiz-chuong4-thpl',
    title: 'CHƯƠNG 4 – THỰC HIỆN PHÁP LUẬT',
    chapter: 'Chương 4: Thực hiện pháp luật',
    instructions: 'Trích xuất từ tài liệu Chương 4. Thực hiện PL.pdf. Bao gồm 20 câu hỏi trắc nghiệm về các hình thức thực hiện pháp luật (tuân thủ, chấp hành, sử dụng, áp dụng pháp luật), văn bản áp dụng pháp luật và áp dụng tương tự.',
    durationMinutes: 20,
    maxAttempts: 0,
    viewScoreMode: 'immediate',
    viewAnswersMode: 'after_submit',
    targetClasses: ['Tất cả'],
    status: 'published',
    passingScore: 5.0,
    isSample: false,
    createdAt: '2024-10-27T12:00:00.000Z',
    createdBy: 'ThS. Ngô Thị Mai Anh - Khoa Luật',
  },
  {
    id: 'quiz-chuong4-vppl',
    title: 'CHƯƠNG 4 – VI PHẠM PHÁP LUẬT',
    chapter: 'Chương 4: Vi phạm pháp luật và trách nhiệm pháp lý',
    instructions: 'Trích xuất từ tài liệu Chương 4. Vi phạm PL.pdf. Bao gồm 20 câu hỏi trắc nghiệm về dấu hiệu vi phạm pháp luật, cấu thành vi phạm pháp luật (mặt chủ quan, mặt khách quan, chủ thể, khách thể) và trách nhiệm pháp lý.',
    durationMinutes: 20,
    maxAttempts: 0,
    viewScoreMode: 'immediate',
    viewAnswersMode: 'after_submit',
    targetClasses: ['Tất cả'],
    status: 'published',
    passingScore: 5.0,
    isSample: false,
    createdAt: '2024-10-27T12:00:00.000Z',
    createdBy: 'ThS. Ngô Thị Mai Anh - Khoa Luật',
  },
  {
    id: 'quiz-chuong5-lhp',
    title: 'CHƯƠNG 5 – LUẬT HIẾN PHÁP',
    chapter: 'Chương 5: Luật Hiến pháp',
    instructions: 'Trích xuất từ tài liệu Chương 5. Luật Hiến pháp.pdf. Bao gồm 30 câu hỏi trắc nghiệm về tính chất đạo luật gốc của Hiến pháp, hệ thống chính trị, Quốc hội, Chủ tịch nước, Chính phủ, quốc tịch và quy trình lập hiến.',
    durationMinutes: 30,
    maxAttempts: 0,
    viewScoreMode: 'immediate',
    viewAnswersMode: 'after_submit',
    targetClasses: ['Tất cả'],
    status: 'published',
    passingScore: 5.0,
    isSample: false,
    createdAt: '2024-10-27T12:00:00.000Z',
    createdBy: 'ThS. Ngô Thị Mai Anh - Khoa Luật',
  },
];

export const OFFICIAL_QUIZ_QUESTIONS: QuizQuestion[] = [
  ...questionBankChuong1Bo1.map((q, idx) =>
    convertToQuizQuestion(q, 'quiz-chuong1-bo1', idx + 1, 'Chương 1: Nguồn gốc & Bản chất Nhà nước')
  ),
  ...questionBankChuong1Bo2.map((q, idx) =>
    convertToQuizQuestion(q, 'quiz-chuong1-bo2', idx + 1, 'Chương 1: Hình thức & Bộ máy Nhà nước')
  ),
  ...questionBankChuong2Bo1.map((q, idx) =>
    convertToQuizQuestion(q, 'quiz-chuong2-bo1', idx + 1, 'Chương 2: Nguồn của pháp luật')
  ),
  ...questionBankChuong2Bo2.map((q, idx) =>
    convertToQuizQuestion(q, 'quiz-chuong2-bo2', idx + 1, 'Chương 2: Bản chất & Vai trò của Pháp luật')
  ),
  ...questionBankChuong3QuyPhamPhapLuat.map((q, idx) =>
    convertToQuizQuestion(q, 'quiz-chuong3-qppl', idx + 1, 'Chương 3: Quy phạm pháp luật')
  ),
  ...questionBankChuong3QuanHePhapLuat.map((q, idx) =>
    convertToQuizQuestion(q, 'quiz-chuong3-qhpl', idx + 1, 'Chương 3: Quan hệ pháp luật')
  ),
  ...questionBankChuong4ThucHienPhapLuat.map((q, idx) =>
    convertToQuizQuestion(q, 'quiz-chuong4-thpl', idx + 1, 'Chương 4: Thực hiện pháp luật')
  ),
  ...questionBankChuong4ViPhamPhapLuat.map((q, idx) =>
    convertToQuizQuestion(q, 'quiz-chuong4-vppl', idx + 1, 'Chương 4: Vi phạm pháp luật & Trách nhiệm pháp lý')
  ),
  ...questionBankChuong5LuatHienPhap.map((q, idx) =>
    convertToQuizQuestion(q, 'quiz-chuong5-lhp', idx + 1, 'Chương 5: Luật Hiến pháp')
  ),
];
