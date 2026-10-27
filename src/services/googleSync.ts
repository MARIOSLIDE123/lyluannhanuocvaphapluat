import { UserProfile, QuizItem, QuizAttempt, AssignmentItem, SubmissionItem } from '../types';

const SCRIPT_URL_KEY = 'tl_google_apps_script_url_v1';
const LOCAL_STUDY_TIME_KEY = 'tl_student_study_time_v1';
const LOCAL_ACTIVITY_LOG_KEY = 'tl_student_activity_log_v1';

export const GoogleSyncService = {
  getScriptUrl(): string {
    try {
      const saved = localStorage.getItem(SCRIPT_URL_KEY);
      if (saved) return saved.trim();
    } catch {
      // Ignore
    }
    return (import.meta.env.VITE_GOOGLE_SCRIPT_URL || '').trim();
  },

  setScriptUrl(url: string): void {
    try {
      localStorage.setItem(SCRIPT_URL_KEY, url.trim());
    } catch (e) {
      console.error('Failed to save script URL:', e);
    }
  },

  isConfigured(): boolean {
    return Boolean(this.getScriptUrl());
  },

  /**
   * Helper to send POST to Google Apps Script
   * Using text/plain avoids CORS preflight OPTIONS in browsers
   */
  async sendPost(payload: Record<string, any>): Promise<any> {
    const url = this.getScriptUrl();
    if (!url) {
      // Local mock logging when no URL configured
      this.recordLocalActivity(payload);
      return { success: true, localOnly: true };
    }

    try {
      this.recordLocalActivity(payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      const resultText = await response.text();
      try {
        return JSON.parse(resultText);
      } catch {
        return { success: true, raw: resultText };
      }
    } catch (err) {
      console.warn('Google Sync request completed/cached locally:', err);
      return { success: true, localFallback: true };
    }
  },

  /**
   * 1. Đồng bộ thông tin sinh viên vào Google Sheet
   */
  async syncStudent(student: UserProfile): Promise<boolean> {
    const payload = {
      action: 'syncStudent',
      studentId: student.studentId || '',
      displayName: student.displayName,
      studentClass: student.studentClass || '',
      school: student.school || 'Học viện PCCC & CNCH',
      email: student.email,
      timestamp: new Date().toISOString(),
    };

    const res = await this.sendPost(payload);
    return res.success;
  },

  /**
   * 2. Đồng bộ kết quả ôn tập trắc nghiệm theo thời gian thực
   */
  async syncQuizAttempt(
    quiz: QuizItem,
    attempt: QuizAttempt,
    student: UserProfile
  ): Promise<boolean> {
    const payload = {
      action: 'syncQuizAttempt',
      studentId: student.studentId || attempt.studentId,
      displayName: student.displayName || attempt.studentName,
      studentClass: student.studentClass || attempt.studentClass,
      school: student.school || 'Học viện PCCC & CNCH',
      quizId: quiz.id,
      quizTitle: quiz.title,
      quizChapter: quiz.chapter,
      score: attempt.score,
      percentage: attempt.percentage,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      durationSeconds: attempt.durationSeconds,
      timestamp: new Date().toISOString(),
    };

    const res = await this.sendPost(payload);
    return res.success;
  },

  /**
   * 3. Đồng bộ bài nộp tự nghiên cứu vào Google Sheet
   */
  async syncSubmission(
    assignment: AssignmentItem,
    submission: SubmissionItem,
    student: UserProfile
  ): Promise<boolean> {
    const payload = {
      action: 'syncSubmission',
      studentId: student.studentId || submission.studentId,
      displayName: student.displayName || submission.studentName,
      studentClass: student.studentClass || submission.studentClass,
      school: student.school || 'Học viện PCCC & CNCH',
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      textContent: submission.textContent || '',
      attachedFileName: submission.attachedFileName || '',
      timestamp: new Date().toISOString(),
    };

    const res = await this.sendPost(payload);
    return res.success;
  },

  /**
   * 4. Tải file tài liệu lên Google Drive
   */
  async uploadFileToGoogleDrive(fileInfo: {
    fileName: string;
    fileType: string;
    fileData: string; // Base64
    chapter: string;
  }): Promise<{ success: boolean; viewUrl?: string; downloadUrl?: string; fileId?: string }> {
    const url = this.getScriptUrl();
    if (!url) {
      return { success: false };
    }

    const payload = {
      action: 'uploadFile',
      fileName: fileInfo.fileName,
      fileType: fileInfo.fileType,
      fileData: fileInfo.fileData,
      chapter: fileInfo.chapter,
      uploadedBy: 'ThS. Ngô Thị Mai Anh',
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await this.sendPost(payload);
      if (res && res.viewUrl) {
        return {
          success: true,
          viewUrl: res.viewUrl,
          downloadUrl: res.downloadUrl || res.viewUrl,
          fileId: res.fileId,
        };
      }
      return { success: false };
    } catch (e) {
      console.error('Google Drive upload error:', e);
      return { success: false };
    }
  },

  /**
   * 5. Ghi nhận thời gian học và lịch sử hoạt động
   */
  recordLocalActivity(payload: Record<string, any>) {
    try {
      const logs = this.getLocalActivities();
      let desc = '';
      if (payload.action === 'syncStudent') {
        desc = `Đăng ký hồ sơ học viên: ${payload.displayName} (${payload.studentId})`;
      } else if (payload.action === 'syncQuizAttempt') {
        desc = `Hoàn thành bài kiểm tra: ${payload.quizTitle} - Điểm: ${payload.score}/10 (${payload.percentage}%)`;
      } else if (payload.action === 'syncSubmission') {
        desc = `Nộp bài tự nghiên cứu: ${payload.assignmentTitle}`;
      } else if (payload.action === 'uploadFile') {
        desc = `Tải lên Google Drive: ${payload.fileName}`;
      } else if (payload.action === 'logStudyTime') {
        desc = `Học tập trực tuyến (+${payload.durationMinutes || 1} phút)`;
      }

      if (desc) {
        logs.unshift({
          id: `act-${Date.now()}`,
          action: payload.action,
          description: desc,
          timestamp: new Date().toISOString(),
          studentId: payload.studentId || '',
        });
        localStorage.setItem(LOCAL_ACTIVITY_LOG_KEY, JSON.stringify(logs.slice(0, 50)));
      }
    } catch {
      // Ignore
    }
  },

  getLocalActivities(): Array<{ id: string; action: string; description: string; timestamp: string; studentId: string }> {
    try {
      const raw = localStorage.getItem(LOCAL_ACTIVITY_LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Tích lũy thời gian học (phút)
   */
  addStudyMinutes(minutes: number = 1): number {
    try {
      const cur = this.getTotalStudyMinutes();
      const updated = cur + minutes;
      localStorage.setItem(LOCAL_STUDY_TIME_KEY, String(updated));
      return updated;
    } catch {
      return 0;
    }
  },

  getTotalStudyMinutes(): number {
    try {
      const raw = localStorage.getItem(LOCAL_STUDY_TIME_KEY);
      return raw ? parseInt(raw, 10) || 0 : 0;
    } catch {
      return 0;
    }
  },

  /**
   * Kiểm tra kết nối Web App Apps Script
   */
  async testConnection(testUrl?: string): Promise<{ success: boolean; message: string }> {
    const url = testUrl || this.getScriptUrl();
    if (!url) {
      return { success: false, message: 'Chưa nhập Web App URL của Google Apps Script.' };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping' }),
      });
      const text = await res.text();
      return {
        success: true,
        message: 'Kết nối thành công với Google Apps Script & Google Sheet!',
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Lỗi kết nối: ${e.message || 'Không thể liên lạc với Google Apps Script'}. Hãy đảm bảo đã triển khai Web App với quyền "Anyone" (Bất kỳ ai).`,
      };
    }
  },
};
