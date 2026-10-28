export type UserRole = 'lecturer' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  studentId?: string; // Mã sinh viên (chỉ dành cho sinh viên)
  studentClass?: string; // Lớp (ví dụ: D30, D31, VB2-PCCC...)
  school?: string; // Trường (ví dụ: Học viện PCCC & CNCH...)
  course: string; // Tên học phần: Lý luận Nhà nước và Pháp luật
  avatarUrl?: string;
  isFirstAdmin?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type MaterialCategory =
  | '01_syllabus' // 1. Đề cương chi tiết học phần
  | '02_main_textbooks' // 2. Tài liệu chính
  | '02_textbooks' // Alias tương thích cho Tài liệu chính
  | '03_references' // 3. Tài liệu tham khảo
  | '03_legal_docs' // Alias tương thích
  | '04_discussion_topics' // 4. Hệ thống câu hỏi thảo luận
  | '04_chapter_materials' // Alias tương thích
  | '05_case_studies' // 5. Hệ thống bài tập tình huống
  | '06_case_studies' // Alias tương thích
  | '07_supplementary';

export type ValidityStatus = 'active' | 'expired' | 'amended' | 'unverified';

export interface MaterialItem {
  id: string;
  title: string;
  description: string;
  category: MaterialCategory;
  chapter: string;
  authorOrIssuer?: string; // Tác giả hoặc cơ quan ban hành
  issueDate?: string; // Ngày ban hành
  effectiveDate?: string; // Ngày có hiệu lực
  validityStatus: ValidityStatus; // Tình trạng hiệu lực
  replacementNotes?: string; // Ghi chú văn bản thay thế, sửa đổi, bổ sung
  officialUrl?: string; // Đường dẫn văn bản gốc / nguồn chính thức
  fileName?: string;
  fileSize?: string;
  fileType?: 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'csv' | 'link';
  fileData?: string; // Base64 or Blob storage for preview & download
  isSample: boolean; // Đánh dấu dữ liệu mẫu
  status: 'published' | 'draft' | 'archived';
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  updatedAt?: string;
}

export interface AssignmentItem {
  id: string;
  title: string;
  chapter: string;
  objectives: string; // Mục tiêu nghiên cứu
  requirements: string; // Yêu cầu thực hiện
  guidingQuestions: string[]; // Câu hỏi định hướng
  linkedMaterialIds: string[]; // ID tài liệu tham khảo liên kết trong kho
  attachedFileName?: string;
  attachedFileSize?: string;
  attachedFileData?: string;
  assignedDate: string;
  dueDate: string;
  targetClasses: string[]; // ['Tất cả'] hoặc danh sách lớp cụ thể
  status: 'draft' | 'published' | 'closed' | 'archived';
  submissionType: 'text' | 'file' | 'both';
  maxScore: number;
  allowResubmission: boolean;
  isSample: boolean;
  createdAt: string;
  createdBy: string;
}

export interface SubmissionItem {
  id: string;
  assignmentId: string;
  studentUid: string;
  studentName: string;
  studentId: string;
  studentClass: string;
  textContent?: string;
  attachedFileName?: string;
  attachedFileSize?: string;
  attachedFileData?: string;
  submittedAt: string;
  isLate: boolean;
  version: number;
  status: 'submitted' | 'graded' | 'needs_revision';
  score?: number;
  feedback?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export type QuestionDifficulty = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng';

export interface QuizQuestion {
  id: string;
  quizId: string;
  content: string;
  options: string[];
  correctAnswer: number; // 0 for A, 1 for B, 2 for C, 3 for D
  questionType: 'single' | 'true_false';
  points: number;
  explanation: string;
  topic: string;
  difficulty: QuestionDifficulty;
  order: number;
}

export interface QuizItem {
  id: string;
  title: string;
  chapter: string;
  instructions: string;
  durationMinutes: number; // 0 = không giới hạn thời gian
  maxAttempts: number; // Số lần làm tối đa (ví dụ 1, 2, 3 hoặc 0 = không giới hạn)
  viewScoreMode: 'immediate' | 'on_close';
  viewAnswersMode: 'after_submit' | 'on_close' | 'never';
  targetClasses: string[];
  status: 'draft' | 'published' | 'closed' | 'archived';
  passingScore: number;
  isSample: boolean;
  createdAt: string;
  createdBy: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentUid: string;
  studentName: string;
  studentId: string;
  studentClass: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
  answers: Record<string, number>; // { [questionId]: selectedOptionIndex }
  score: number;
  totalPoints: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  status: 'in_progress' | 'completed';
  attemptNumber: number;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: 'Lịch học' | 'Nhiệm vụ mới' | 'Lưu ý kiểm tra' | 'Tài liệu mới' | 'Chung';
  priority: 'normal' | 'important' | 'urgent';
  isPinned: boolean;
  targetClasses: string[];
  createdAt: string;
  createdByName: string;
}

export interface SystemConfig {
  lecturerInitialized: boolean;
  lecturerName: string;
  lecturerEmail: string;
  institutionName: string;
  facultyName: string;
  courseName: string;
  courseEnglishName: string;
  adminLock: boolean;
}
