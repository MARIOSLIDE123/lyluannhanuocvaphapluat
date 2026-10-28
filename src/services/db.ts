import {
  UserProfile,
  MaterialItem,
  AssignmentItem,
  SubmissionItem,
  QuizItem,
  QuizQuestion,
  QuizAttempt,
  AnnouncementItem,
  SystemConfig,
} from '../types';
import { OFFICIAL_QUIZ_SETS, OFFICIAL_QUIZ_QUESTIONS } from '../data/questionBanks';
import { GoogleSyncService } from './googleSync';

const STORAGE_KEYS = {
  CONFIG: 'tl_system_config_v1',
  USERS: 'tl_users_v1',
  CURRENT_USER: 'tl_current_user_v1',
  MATERIALS: 'tl_materials_v1',
  ASSIGNMENTS: 'tl_assignments_v1',
  SUBMISSIONS: 'tl_submissions_v1',
  QUIZZES: 'tl_quizzes_v1',
  QUESTIONS: 'tl_questions_v1',
  ATTEMPTS: 'tl_attempts_v1',
  ANNOUNCEMENTS: 'tl_announcements_v1',
};

// Event system for real-time reactivity across components
type DBEventType =
  | 'materials'
  | 'assignments'
  | 'submissions'
  | 'quizzes'
  | 'questions'
  | 'attempts'
  | 'announcements'
  | 'users'
  | 'config';

const listeners: Map<DBEventType, Set<() => void>> = new Map();

export function subscribe(event: DBEventType, callback: () => void): () => void {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)!.add(callback);
  return () => {
    listeners.get(event)?.delete(callback);
  };
}

function notify(event: DBEventType) {
  listeners.get(event)?.forEach(cb => {
    try {
      cb();
    } catch (e) {
      console.error('Error in DB subscriber:', e);
    }
  });

  // Sync to server in background if endpoint exists
  syncToServer();
}

let syncTimeout: any = null;
function syncToServer() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    try {
      const dump = exportFullDatabase();
      fetch('/api/storage/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dump),
      }).catch(() => {
        // Silent catch if offline or server plugin not handling
      });
    } catch (e) {
      // Ignore
    }
  }, 1000);
}

// Default System Configuration
const DEFAULT_CONFIG: SystemConfig = {
  lecturerInitialized: true,
  lecturerName: 'Ngô Thị Mai Anh',
  lecturerEmail: 'maianhtq@gmail.com',
  institutionName: 'Học viện Phòng cháy chữa cháy và cứu nạn cứu hộ',
  facultyName: 'Khoa Luật',
  courseName: 'Lý luận nhà nước và pháp luật',
  courseEnglishName: 'Theory of State and Law',
  adminLock: true,
};

// Default Lecturer User Profile
export const DEFAULT_LECTURER: UserProfile = {
  uid: 'lecturer-ngo-mai-anh',
  email: 'maianhtq@gmail.com',
  displayName: 'ThS. Ngô Thị Mai Anh',
  role: 'lecturer',
  course: 'Lý luận nhà nước và pháp luật',
  isFirstAdmin: true,
  createdAt: new Date().toISOString(),
};

// Teacher default credentials
export const TEACHER_CREDENTIALS = {
  username: 'ngothimaianh',
  password: '2026',
};

// Demo Student Profiles (empty by default)
const DEMO_STUDENTS: UserProfile[] = [];

// Seed Sample Data (Cleaned and emptied as requested)
const SEED_MATERIALS: MaterialItem[] = [];
const SEED_ASSIGNMENTS: AssignmentItem[] = [];
const SEED_SUBMISSIONS: SubmissionItem[] = [];
const SEED_QUIZZES: QuizItem[] = OFFICIAL_QUIZ_SETS;
const SEED_QUESTIONS: QuizQuestion[] = OFFICIAL_QUIZ_QUESTIONS;
const SEED_ATTEMPTS: QuizAttempt[] = [];

// Seed Sample Announcements
const SEED_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann-001',
    title: 'Thông báo về kế hoạch giảng dạy học phần Lý luận nhà nước và pháp luật',
    content: 'Chào các bạn học viên. Học phần Lý luận nhà nước và pháp luật gồm 42 tiết (2 tín chỉ) dành cho học viên Hệ Đại học chính quy Công an. Đề nghị các bạn nghiên cứu kỹ Đề cương học phần và hoàn thành các nhiệm vụ tự nghiên cứu trong Kho học liệu trước mỗi buổi học trên giảng đường.',
    category: 'Lịch học',
    priority: 'urgent',
    isPinned: true,
    targetClasses: ['Tất cả'],
    createdAt: '2024-09-01T08:00:00.000Z',
    createdByName: 'Ngô Thị Mai Anh - Khoa Luật',
  },
  {
    id: 'ann-002',
    title: 'Mở nhiệm vụ tự nghiên cứu số 01: Nguồn gốc và bản chất của Nhà nước',
    content: 'Hệ thống đã mở nhiệm vụ tự nghiên cứu Chương 1. Hạn chót nộp bài là trước 23h59 ngày học trực tiếp. Các bạn có thể nhập văn bản trực tiếp hoặc đính kèm file Word/PDF.',
    category: 'Nhiệm vụ mới',
    priority: 'important',
    isPinned: false,
    targetClasses: ['Tất cả'],
    createdAt: '2024-09-05T08:00:00.000Z',
    createdByName: 'Ngô Thị Mai Anh - Khoa Luật',
  },
  {
    id: 'ann-003',
    title: 'Lưu ý về bài kiểm tra trắc nghiệm củng cố sau giờ học',
    content: 'Sau khi kết thúc Chương 1, các bạn truy cập mục "Ôn tập trắc nghiệm" để làm bài củng cố kiến thức. Điểm bài trắc nghiệm được tính vào điểm đánh giá quá trình học tập.',
    category: 'Lưu ý kiểm tra',
    priority: 'normal',
    isPinned: false,
    targetClasses: ['Tất cả'],
    createdAt: '2024-09-06T09:00:00.000Z',
    createdByName: 'Ngô Thị Mai Anh - Khoa Luật',
  },
];

// Database Helper methods
function loadStorage<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to load ${key}:`, e);
    return defaultVal;
  }
}

function saveStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Failed to save ${key}:`, e);
  }
}

// Initial Database Bootstrapping
export function initializeDatabase() {
  const existingConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
  if (!existingConfig) {
    saveStorage(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    saveStorage(STORAGE_KEYS.USERS, [DEFAULT_LECTURER]);
    saveStorage(STORAGE_KEYS.CURRENT_USER, null);
    saveStorage(STORAGE_KEYS.MATERIALS, []);
    saveStorage(STORAGE_KEYS.ASSIGNMENTS, []);
    saveStorage(STORAGE_KEYS.SUBMISSIONS, []);
    saveStorage(STORAGE_KEYS.QUIZZES, OFFICIAL_QUIZ_SETS);
    saveStorage(STORAGE_KEYS.QUESTIONS, OFFICIAL_QUIZ_QUESTIONS);
    saveStorage(STORAGE_KEYS.ATTEMPTS, []);
    saveStorage(STORAGE_KEYS.ANNOUNCEMENTS, SEED_ANNOUNCEMENTS);
    console.log('Database initialized with default schema & clean empty content.');
  }

  // Purge any residual sample data from existing localStorage
  const samplePurgeKey = 'tl_sample_purged_v2';
  if (localStorage.getItem(samplePurgeKey) !== 'true') {
    const materials = loadStorage<MaterialItem[]>(STORAGE_KEYS.MATERIALS, []).filter(
      m => !m.isSample && !m.id.startsWith('mat-')
    );
    saveStorage(STORAGE_KEYS.MATERIALS, materials);

    const assignments = loadStorage<AssignmentItem[]>(STORAGE_KEYS.ASSIGNMENTS, []).filter(
      a => !a.isSample && !a.id.startsWith('assign-')
    );
    saveStorage(STORAGE_KEYS.ASSIGNMENTS, assignments);

    const submissions = loadStorage<SubmissionItem[]>(STORAGE_KEYS.SUBMISSIONS, []).filter(
      s => !s.id.startsWith('sub-')
    );
    saveStorage(STORAGE_KEYS.SUBMISSIONS, submissions);

    const quizzes = loadStorage<QuizItem[]>(STORAGE_KEYS.QUIZZES, []).filter(
      q => !q.isSample && !q.id.startsWith('quiz-')
    );
    saveStorage(STORAGE_KEYS.QUIZZES, quizzes);

    const questions = loadStorage<QuizQuestion[]>(STORAGE_KEYS.QUESTIONS, []).filter(
      q => !q.id.startsWith('q-')
    );
    saveStorage(STORAGE_KEYS.QUESTIONS, questions);

    const attempts = loadStorage<QuizAttempt[]>(STORAGE_KEYS.ATTEMPTS, []).filter(
      a => !a.id.startsWith('att-')
    );
    saveStorage(STORAGE_KEYS.ATTEMPTS, attempts);

    // If current user in storage is default lecturer or demo student, reset to null so student entry gate shows
    const current = loadStorage<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (current && (current.uid === DEFAULT_LECTURER.uid || current.uid.startsWith('student-tran-van-nam') || current.uid.startsWith('student-le-thi-hoa') || current.uid.startsWith('student-nguyen-minh-duc'))) {
      saveStorage(STORAGE_KEYS.CURRENT_USER, null);
    }

    localStorage.setItem(samplePurgeKey, 'true');
  }

  // Idempotently ensure all 9 Official Question Banks (190 questions) are loaded and up-to-date
  const existingQuizzes = loadStorage<QuizItem[]>(STORAGE_KEYS.QUIZZES, []);
  let quizzesChanged = false;
  OFFICIAL_QUIZ_SETS.forEach(officialQ => {
    const idx = existingQuizzes.findIndex(q => q.id === officialQ.id);
    if (idx >= 0) {
      existingQuizzes[idx] = { ...existingQuizzes[idx], ...officialQ };
      quizzesChanged = true;
    } else {
      existingQuizzes.push(officialQ);
      quizzesChanged = true;
    }
  });
  if (quizzesChanged) {
    saveStorage(STORAGE_KEYS.QUIZZES, existingQuizzes);
    notify('quizzes');
  }

  const existingQuestions = loadStorage<QuizQuestion[]>(STORAGE_KEYS.QUESTIONS, []);
  let questionsChanged = false;
  OFFICIAL_QUIZ_QUESTIONS.forEach(officialQ => {
    const idx = existingQuestions.findIndex(q => q.id === officialQ.id);
    if (idx >= 0) {
      existingQuestions[idx] = { ...existingQuestions[idx], ...officialQ };
      questionsChanged = true;
    } else {
      existingQuestions.push(officialQ);
      questionsChanged = true;
    }
  });
  if (questionsChanged) {
    saveStorage(STORAGE_KEYS.QUESTIONS, existingQuestions);
    notify('questions');
  }
}

// ================= USER & AUTH SERVICES =================
export const UserService = {
  getConfig(): SystemConfig {
    return loadStorage<SystemConfig>(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
  },
  updateConfig(updates: Partial<SystemConfig>): SystemConfig {
    const current = this.getConfig();
    const updated = { ...current, ...updates };
    saveStorage(STORAGE_KEYS.CONFIG, updated);
    notify('config');
    return updated;
  },
  getUsers(): UserProfile[] {
    return loadStorage<UserProfile[]>(STORAGE_KEYS.USERS, [DEFAULT_LECTURER]);
  },
  getUserByUid(uid: string): UserProfile | undefined {
    return this.getUsers().find(u => u.uid === uid);
  },
  getCurrentUser(): UserProfile | null {
    const user = loadStorage<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
    return user;
  },
  getDefaultLecturer(): UserProfile {
    return DEFAULT_LECTURER;
  },
  verifyTeacher(username: string, pass: string): boolean {
    return (
      username.trim().toLowerCase() === TEACHER_CREDENTIALS.username.toLowerCase() &&
      pass.trim() === TEACHER_CREDENTIALS.password
    );
  },
  setCurrentUser(user: UserProfile | null): void {
    saveStorage(STORAGE_KEYS.CURRENT_USER, user);
    notify('users');
  },
  registerOrUpdateUser(user: UserProfile): UserProfile {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.uid === user.uid);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user, updatedAt: new Date().toISOString() };
    } else {
      users.push({ ...user, createdAt: new Date().toISOString() });
    }
    saveStorage(STORAGE_KEYS.USERS, users);
    if (this.getCurrentUser()?.uid === user.uid) {
      this.setCurrentUser(user);
    }
    notify('users');
    return user;
  },
  getStudents(): UserProfile[] {
    return this.getUsers().filter(u => u.role === 'student');
  },
  getLecturers(): UserProfile[] {
    return this.getUsers().filter(u => u.role === 'lecturer');
  },
  getUniqueClasses(): string[] {
    const students = this.getStudents();
    const set = new Set<string>();
    students.forEach(s => {
      if (s.studentClass) set.add(s.studentClass);
    });
    return Array.from(set).sort();
  },
};

// ================= MATERIALS REPOSITORY =================
export const MaterialService = {
  getAll(): MaterialItem[] {
    return loadStorage<MaterialItem[]>(STORAGE_KEYS.MATERIALS, SEED_MATERIALS);
  },
  getPublished(): MaterialItem[] {
    return this.getAll().filter(m => m.status === 'published');
  },
  getById(id: string): MaterialItem | undefined {
    return this.getAll().find(m => m.id === id);
  },
  save(item: Omit<MaterialItem, 'id' | 'uploadedAt'> & { id?: string }): MaterialItem {
    const list = this.getAll();
    const id = item.id || `mat-${Date.now()}`;
    const now = new Date().toISOString();
    const existingIndex = list.findIndex(m => m.id === id);

    let savedItem: MaterialItem;
    if (existingIndex >= 0) {
      savedItem = {
        ...list[existingIndex],
        ...item,
        id,
        updatedAt: now,
      };
      list[existingIndex] = savedItem;
    } else {
      savedItem = {
        ...item,
        id,
        uploadedAt: now,
      } as MaterialItem;
      list.unshift(savedItem);
    }
    saveStorage(STORAGE_KEYS.MATERIALS, list);
    notify('materials');

    // Đồng bộ trực tiếp lên Google Sheet & Drive theo thời gian thực
    if (GoogleSyncService.isConfigured()) {
      GoogleSyncService.syncMaterialOnline(savedItem).catch(err => {
        console.warn('Real-time Google Sheet material sync notice:', err);
      });
    }

    return savedItem;
  },
  delete(id: string): void {
    const list = this.getAll().filter(m => m.id !== id);
    saveStorage(STORAGE_KEYS.MATERIALS, list);
    notify('materials');

    // Xóa khỏi Google Sheet theo thời gian thực
    if (GoogleSyncService.isConfigured()) {
      GoogleSyncService.deleteMaterialOnline(id).catch(err => {
        console.warn('Real-time Google Sheet material deletion notice:', err);
      });
    }
  },
  mergeRemoteMaterials(remoteList: MaterialItem[]): MaterialItem[] {
    if (!Array.isArray(remoteList) || remoteList.length === 0) return this.getAll();
    const current = this.getAll();
    let hasChanges = false;

    remoteList.forEach(remoteItem => {
      const idx = current.findIndex(
        m => m.id === remoteItem.id || (m.officialUrl && remoteItem.officialUrl && m.officialUrl === remoteItem.officialUrl)
      );
      if (idx >= 0) {
        current[idx] = {
          ...current[idx],
          ...remoteItem,
          fileData: current[idx].fileData || remoteItem.fileData,
        };
        hasChanges = true;
      } else {
        current.unshift(remoteItem);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      saveStorage(STORAGE_KEYS.MATERIALS, current);
      notify('materials');
    }
    return current;
  },
};

// ================= ASSIGNMENTS & SUBMISSIONS =================
export const AssignmentService = {
  getAll(): AssignmentItem[] {
    return loadStorage<AssignmentItem[]>(STORAGE_KEYS.ASSIGNMENTS, SEED_ASSIGNMENTS);
  },
  getPublished(): AssignmentItem[] {
    return this.getAll().filter(a => a.status === 'published' || a.status === 'closed');
  },
  getById(id: string): AssignmentItem | undefined {
    return this.getAll().find(a => a.id === id);
  },
  save(item: Omit<AssignmentItem, 'id' | 'createdAt'> & { id?: string }): AssignmentItem {
    const list = this.getAll();
    const id = item.id || `assign-${Date.now()}`;
    const now = new Date().toISOString();
    const existingIndex = list.findIndex(a => a.id === id);

    let savedItem: AssignmentItem;
    if (existingIndex >= 0) {
      savedItem = {
        ...list[existingIndex],
        ...item,
        id,
      };
      list[existingIndex] = savedItem;
    } else {
      savedItem = {
        ...item,
        id,
        createdAt: now,
      } as AssignmentItem;
      list.unshift(savedItem);
    }
    saveStorage(STORAGE_KEYS.ASSIGNMENTS, list);
    notify('assignments');
    return savedItem;
  },
  delete(id: string): void {
    const list = this.getAll().filter(a => a.id !== id);
    saveStorage(STORAGE_KEYS.ASSIGNMENTS, list);
    notify('assignments');
  },

  // Submissions
  getSubmissions(): SubmissionItem[] {
    return loadStorage<SubmissionItem[]>(STORAGE_KEYS.SUBMISSIONS, SEED_SUBMISSIONS);
  },
  getSubmissionsByAssignment(assignmentId: string): SubmissionItem[] {
    return this.getSubmissions().filter(s => s.assignmentId === assignmentId);
  },
  getStudentSubmission(assignmentId: string, studentUid: string): SubmissionItem | undefined {
    return this.getSubmissions().find(
      s => s.assignmentId === assignmentId && s.studentUid === studentUid
    );
  },
  submitAssignment(data: {
    assignmentId: string;
    student: UserProfile;
    textContent?: string;
    attachedFileName?: string;
    attachedFileSize?: string;
    attachedFileData?: string;
  }): SubmissionItem {
    const submissions = this.getSubmissions();
    const assignment = this.getById(data.assignmentId);
    if (!assignment) throw new Error('Không tìm thấy nhiệm vụ');

    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isLate = now.getTime() > dueDate.getTime();

    const existingIndex = submissions.findIndex(
      s => s.assignmentId === data.assignmentId && s.studentUid === data.student.uid
    );

    let submission: SubmissionItem;
    if (existingIndex >= 0) {
      const prev = submissions[existingIndex];
      submission = {
        ...prev,
        textContent: data.textContent,
        attachedFileName: data.attachedFileName || prev.attachedFileName,
        attachedFileSize: data.attachedFileSize || prev.attachedFileSize,
        attachedFileData: data.attachedFileData || prev.attachedFileData,
        submittedAt: now.toISOString(),
        isLate,
        version: (prev.version || 1) + 1,
        status: 'submitted',
      };
      submissions[existingIndex] = submission;
    } else {
      submission = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        assignmentId: data.assignmentId,
        studentUid: data.student.uid,
        studentName: data.student.displayName,
        studentId: data.student.studentId || '',
        studentClass: data.student.studentClass || '',
        textContent: data.textContent,
        attachedFileName: data.attachedFileName,
        attachedFileSize: data.attachedFileSize,
        attachedFileData: data.attachedFileData,
        submittedAt: now.toISOString(),
        isLate,
        version: 1,
        status: 'submitted',
      };
      submissions.push(submission);
    }

    saveStorage(STORAGE_KEYS.SUBMISSIONS, submissions);
    notify('submissions');
    return submission;
  },
  gradeSubmission(submissionId: string, score: number, feedback: string, lecturerName: string): SubmissionItem {
    const list = this.getSubmissions();
    const idx = list.findIndex(s => s.id === submissionId);
    if (idx < 0) throw new Error('Không tìm thấy bài làm');

    list[idx] = {
      ...list[idx],
      score,
      feedback,
      status: 'graded',
      reviewedAt: new Date().toISOString(),
      reviewedBy: lecturerName,
    };
    saveStorage(STORAGE_KEYS.SUBMISSIONS, list);
    notify('submissions');
    return list[idx];
  },
};

// ================= QUIZZES & QUESTIONS =================
export const QuizService = {
  getQuizzes(): QuizItem[] {
    const list = loadStorage<QuizItem[]>(STORAGE_KEYS.QUIZZES, SEED_QUIZZES);
    const missing = OFFICIAL_QUIZ_SETS.filter(oq => !list.some(q => q.id === oq.id));
    if (missing.length > 0) {
      const merged = [...list, ...missing];
      saveStorage(STORAGE_KEYS.QUIZZES, merged);
      return merged;
    }
    return list;
  },
  getPublishedQuizzes(): QuizItem[] {
    return this.getQuizzes().filter(q => q.status === 'published');
  },
  getQuizById(id: string): QuizItem | undefined {
    return this.getQuizzes().find(q => q.id === id);
  },
  saveQuiz(quiz: Omit<QuizItem, 'id' | 'createdAt'> & { id?: string }): QuizItem {
    const list = this.getQuizzes();
    const id = quiz.id || `quiz-${Date.now()}`;
    const now = new Date().toISOString();
    const idx = list.findIndex(q => q.id === id);

    let saved: QuizItem;
    if (idx >= 0) {
      saved = { ...list[idx], ...quiz, id };
      list[idx] = saved;
    } else {
      saved = { ...quiz, id, createdAt: now } as QuizItem;
      list.unshift(saved);
    }
    saveStorage(STORAGE_KEYS.QUIZZES, list);
    notify('quizzes');
    return saved;
  },
  deleteQuiz(id: string): void {
    const list = this.getQuizzes().filter(q => q.id !== id);
    saveStorage(STORAGE_KEYS.QUIZZES, list);
    // Also remove associated questions
    const questions = this.getAllQuestions().filter(q => q.quizId !== id);
    saveStorage(STORAGE_KEYS.QUESTIONS, questions);
    notify('quizzes');
    notify('questions');
  },

  // Questions
  getAllQuestions(): QuizQuestion[] {
    const list = loadStorage<QuizQuestion[]>(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
    const missing = OFFICIAL_QUIZ_QUESTIONS.filter(oq => !list.some(q => q.id === oq.id));
    if (missing.length > 0) {
      const merged = [...list, ...missing];
      saveStorage(STORAGE_KEYS.QUESTIONS, merged);
      return merged;
    }
    return list;
  },
  getQuestionsByQuiz(quizId: string): QuizQuestion[] {
    return this.getAllQuestions()
      .filter(q => q.quizId === quizId)
      .sort((a, b) => a.order - b.order);
  },
  // Sanitized questions for students (excluding correctAnswer and explanation until allowed)
  getQuestionsForStudent(quizId: string): Omit<QuizQuestion, 'correctAnswer' | 'explanation'>[] {
    return this.getQuestionsByQuiz(quizId).map(q => {
      const { correctAnswer, explanation, ...rest } = q;
      return rest;
    });
  },
  saveQuestion(question: Omit<QuizQuestion, 'id'> & { id?: string }): QuizQuestion {
    const list = this.getAllQuestions();
    const id = question.id || `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const idx = list.findIndex(q => q.id === id);

    let saved: QuizQuestion;
    if (idx >= 0) {
      saved = { ...list[idx], ...question, id };
      list[idx] = saved;
    } else {
      saved = { ...question, id } as QuizQuestion;
      list.push(saved);
    }
    saveStorage(STORAGE_KEYS.QUESTIONS, list);
    notify('questions');
    return saved;
  },
  bulkSaveQuestions(questions: (Omit<QuizQuestion, 'id'> & { id?: string })[]): void {
    const list = this.getAllQuestions();
    questions.forEach((q, i) => {
      const id = q.id || `q-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const idx = list.findIndex(item => item.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...q, id };
      } else {
        list.push({ ...q, id } as QuizQuestion);
      }
    });
    saveStorage(STORAGE_KEYS.QUESTIONS, list);
    notify('questions');
  },
  deleteQuestion(id: string): void {
    const list = this.getAllQuestions().filter(q => q.id !== id);
    saveStorage(STORAGE_KEYS.QUESTIONS, list);
    notify('questions');
  },

  // Attempts
  getAttempts(): QuizAttempt[] {
    return loadStorage<QuizAttempt[]>(STORAGE_KEYS.ATTEMPTS, SEED_ATTEMPTS);
  },
  getAttemptsByQuiz(quizId: string): QuizAttempt[] {
    return this.getAttempts().filter(a => a.quizId === quizId);
  },
  getStudentAttempts(quizId: string, studentUid: string): QuizAttempt[] {
    return this.getAttempts().filter(a => a.quizId === quizId && a.studentUid === studentUid);
  },
  submitQuizAttempt(data: {
    quizId: string;
    student: UserProfile;
    answers: Record<string, number>;
    startedAt: string;
  }): QuizAttempt {
    const quiz = this.getQuizById(data.quizId);
    if (!quiz) throw new Error('Không tìm thấy bài kiểm tra');

    const questions = this.getQuestionsByQuiz(data.quizId);
    if (questions.length === 0) throw new Error('Bài kiểm tra chưa có câu hỏi');

    const completedAt = new Date().toISOString();
    const durationSeconds = Math.round(
      (new Date(completedAt).getTime() - new Date(data.startedAt).getTime()) / 1000
    );

    // Secure calculation of score
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let earnedPoints = 0;
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

    questions.forEach(q => {
      const selected = data.answers[q.id];
      if (selected === undefined || selected === null) {
        unansweredCount++;
      } else if (selected === q.correctAnswer) {
        correctCount++;
        earnedPoints += q.points || 1;
      } else {
        wrongCount++;
      }
    });

    const scaledScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 10 : 0;
    const roundedScore = Math.round(scaledScore * 10) / 10;
    const percentage = Math.round((correctCount / questions.length) * 100);

    const prevAttempts = this.getStudentAttempts(data.quizId, data.student.uid);

    const attempt: QuizAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      quizId: data.quizId,
      studentUid: data.student.uid,
      studentName: data.student.displayName,
      studentId: data.student.studentId || '',
      studentClass: data.student.studentClass || '',
      startedAt: data.startedAt,
      completedAt,
      durationSeconds,
      answers: data.answers,
      score: roundedScore,
      totalPoints: 10,
      percentage,
      correctCount,
      wrongCount,
      unansweredCount,
      status: 'completed',
      attemptNumber: prevAttempts.length + 1,
    };

    const attempts = this.getAttempts();
    attempts.push(attempt);
    saveStorage(STORAGE_KEYS.ATTEMPTS, attempts);
    notify('attempts');
    return attempt;
  },
};

// ================= ANNOUNCEMENTS =================
export const AnnouncementService = {
  getAll(): AnnouncementItem[] {
    return loadStorage<AnnouncementItem[]>(STORAGE_KEYS.ANNOUNCEMENTS, SEED_ANNOUNCEMENTS);
  },
  save(item: Omit<AnnouncementItem, 'id' | 'createdAt'> & { id?: string }): AnnouncementItem {
    const list = this.getAll();
    const id = item.id || `ann-${Date.now()}`;
    const now = new Date().toISOString();
    const idx = list.findIndex(a => a.id === id);

    let saved: AnnouncementItem;
    if (idx >= 0) {
      saved = { ...list[idx], ...item, id };
      list[idx] = saved;
    } else {
      saved = { ...item, id, createdAt: now } as AnnouncementItem;
      list.unshift(saved);
    }
    saveStorage(STORAGE_KEYS.ANNOUNCEMENTS, list);
    notify('announcements');
    return saved;
  },
  delete(id: string): void {
    const list = this.getAll().filter(a => a.id !== id);
    saveStorage(STORAGE_KEYS.ANNOUNCEMENTS, list);
    notify('announcements');
  },
};

// ================= ANALYTICS & STATS ENGINE =================
export const AnalyticsService = {
  getOverviewMetrics() {
    // Only real registered students (excluding lecturers)
    const students = UserService.getStudents();
    const assignments = AssignmentService.getPublished();
    const submissions = AssignmentService.getSubmissions();
    const quizzes = QuizService.getPublishedQuizzes();
    const attempts = QuizService.getAttempts();

    // Assignment completion stats
    const totalPossibleSubmissions = students.length * assignments.length;
    const actualSubmissions = submissions.length;
    const completionRate =
      totalPossibleSubmissions > 0
        ? Math.round((actualSubmissions / totalPossibleSubmissions) * 100)
        : 0;

    // Quiz average score
    const avgQuizScore =
      attempts.length > 0
        ? Math.round(
            (attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length) * 10
          ) / 10
        : 0;

    return {
      totalStudents: students.length,
      activeAssignments: assignments.length,
      totalSubmissions: actualSubmissions,
      completionRate,
      publishedQuizzes: quizzes.length,
      totalAttempts: attempts.length,
      avgQuizScore,
    };
  },

  getStudentProgressList() {
    const students = UserService.getStudents();
    const assignments = AssignmentService.getPublished();
    const submissions = AssignmentService.getSubmissions();
    const attempts = QuizService.getAttempts();

    return students.map(student => {
      const studentSubs = submissions.filter(s => s.studentUid === student.uid);
      const studentAttempts = attempts.filter(a => a.studentUid === student.uid);

      // Best score per quiz
      const quizMap = new Map<string, number>();
      studentAttempts.forEach(a => {
        const current = quizMap.get(a.quizId) || 0;
        if (a.score > current) quizMap.set(a.quizId, a.score);
      });

      const avgQuizScore =
        quizMap.size > 0
          ? Math.round(
              (Array.from(quizMap.values()).reduce((sum, s) => sum + s, 0) / quizMap.size) *
                10
            ) / 10
          : 0;

      const completionRate =
        assignments.length > 0
          ? Math.round((studentSubs.length / assignments.length) * 100)
          : 0;

      let academicStatus: 'Xuất sắc' | 'Đạt' | 'Cần cố gắng' | 'Chưa nộp bài' = 'Chưa nộp bài';
      if (studentSubs.length > 0 || studentAttempts.length > 0) {
        if (avgQuizScore >= 8.5 && completionRate >= 80) academicStatus = 'Xuất sắc';
        else if (avgQuizScore >= 5.0 && completionRate >= 50) academicStatus = 'Đạt';
        else academicStatus = 'Cần cố gắng';
      }

      return {
        uid: student.uid,
        studentId: student.studentId || 'Chưa cập nhật',
        studentName: student.displayName,
        studentClass: student.studentClass || 'Chưa phân lớp',
        email: student.email,
        submittedCount: studentSubs.length,
        totalAssignments: assignments.length,
        completionRate,
        avgQuizScore,
        quizCount: quizMap.size,
        academicStatus,
      };
    });
  },

  getQuestionAnalysis(quizId: string) {
    const questions = QuizService.getQuestionsByQuiz(quizId);
    const attempts = QuizService.getAttemptsByQuiz(quizId);

    return questions.map(q => {
      const answersForThisQuestion = attempts
        .map(a => a.answers[q.id])
        .filter(ans => ans !== undefined && ans !== null);

      const totalResponses = answersForThisQuestion.length;
      const correctCount = answersForThisQuestion.filter(ans => ans === q.correctAnswer).length;
      const correctRate =
        totalResponses > 0 ? Math.round((correctCount / totalResponses) * 100) : 0;

      // Option distribution
      const optionCounts = q.options.map((_, optIndex) => {
        return answersForThisQuestion.filter(ans => ans === optIndex).length;
      });

      return {
        id: q.id,
        content: q.content,
        topic: q.topic,
        difficulty: q.difficulty,
        correctAnswer: q.correctAnswer,
        options: q.options,
        totalResponses,
        correctCount,
        correctRate,
        optionCounts,
        isChallenging: totalResponses >= 2 && correctRate < 50,
      };
    });
  },
};

// ================= UTILITIES: RESET / CLEAR SAMPLE DATA =================
export function clearAllSampleData(): void {
  // Clear only data marked as isSample
  const materials = MaterialService.getAll().filter(m => !m.isSample);
  saveStorage(STORAGE_KEYS.MATERIALS, materials);

  const assignments = AssignmentService.getAll().filter(a => !a.isSample);
  saveStorage(STORAGE_KEYS.ASSIGNMENTS, assignments);

  const quizzes = QuizService.getQuizzes().filter(q => !q.isSample);
  saveStorage(STORAGE_KEYS.QUIZZES, quizzes);

  notify('materials');
  notify('assignments');
  notify('quizzes');
}

export function restoreDefaultSampleData(): void {
  saveStorage(STORAGE_KEYS.MATERIALS, SEED_MATERIALS);
  saveStorage(STORAGE_KEYS.ASSIGNMENTS, SEED_ASSIGNMENTS);
  saveStorage(STORAGE_KEYS.SUBMISSIONS, SEED_SUBMISSIONS);
  saveStorage(STORAGE_KEYS.QUIZZES, SEED_QUIZZES);
  saveStorage(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
  saveStorage(STORAGE_KEYS.ATTEMPTS, SEED_ATTEMPTS);
  saveStorage(STORAGE_KEYS.ANNOUNCEMENTS, SEED_ANNOUNCEMENTS);

  notify('materials');
  notify('assignments');
  notify('submissions');
  notify('quizzes');
  notify('questions');
  notify('attempts');
  notify('announcements');
}

export function exportFullDatabase(): Record<string, any> {
  return {
    config: UserService.getConfig(),
    users: UserService.getUsers(),
    materials: MaterialService.getAll(),
    assignments: AssignmentService.getAll(),
    submissions: AssignmentService.getSubmissions(),
    quizzes: QuizService.getQuizzes(),
    questions: QuizService.getAllQuestions(),
    attempts: QuizService.getAttempts(),
    announcements: AnnouncementService.getAll(),
    exportedAt: new Date().toISOString(),
  };
}

export function importFullDatabase(data: Record<string, any>): boolean {
  try {
    if (data.config) saveStorage(STORAGE_KEYS.CONFIG, data.config);
    if (data.users) saveStorage(STORAGE_KEYS.USERS, data.users);
    if (data.materials) saveStorage(STORAGE_KEYS.MATERIALS, data.materials);
    if (data.assignments) saveStorage(STORAGE_KEYS.ASSIGNMENTS, data.assignments);
    if (data.submissions) saveStorage(STORAGE_KEYS.SUBMISSIONS, data.submissions);
    if (data.quizzes) saveStorage(STORAGE_KEYS.QUIZZES, data.quizzes);
    if (data.questions) saveStorage(STORAGE_KEYS.QUESTIONS, data.questions);
    if (data.attempts) saveStorage(STORAGE_KEYS.ATTEMPTS, data.attempts);
    if (data.announcements) saveStorage(STORAGE_KEYS.ANNOUNCEMENTS, data.announcements);

    notify('materials');
    notify('assignments');
    notify('submissions');
    notify('quizzes');
    notify('questions');
    notify('attempts');
    notify('announcements');
    notify('users');
    notify('config');
    return true;
  } catch (e) {
    console.error('Import error:', e);
    return false;
  }
}
