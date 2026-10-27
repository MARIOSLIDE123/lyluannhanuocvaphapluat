import { StructuredQuestion } from './types';
import { questionBankChuong1Bo1 } from './chuong1Bo1';
import { questionBankChuong1Bo2 } from './chuong1Bo2';
import { questionBankChuong2Bo1 } from './chuong2Bo1';
import { QuizItem, QuizQuestion } from '../../types';

export * from './types';
export { questionBankChuong1Bo1 } from './chuong1Bo1';
export { questionBankChuong1Bo2 } from './chuong1Bo2';
export { questionBankChuong2Bo1 } from './chuong2Bo1';

export const allStructuredQuestionBanks: Record<string, StructuredQuestion[]> = {
  chuong1_bo1: questionBankChuong1Bo1,
  chuong1_bo2: questionBankChuong1Bo2,
  chuong2_bo1: questionBankChuong2Bo1,
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
];
