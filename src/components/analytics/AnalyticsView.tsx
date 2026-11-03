import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Search,
  Filter,
  Award,
  BookOpen,
  Eye,
  TrendingUp,
  Percent,
  HelpCircle,
  Lock,
  ShieldCheck,
  User,
  KeyRound,
  RefreshCw,
  Database,
  Cloud,
  Code2,
  Upload,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  X,
  FileText,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  AnalyticsService,
  UserService,
  QuizService,
  AssignmentService,
  subscribe,
  exportFullDatabase,
  importFullDatabase,
} from '../../services/db';
import { GoogleSyncService } from '../../services/googleSync';
import { exportGradebookToExcel } from '../../services/excel';
import { APPS_SCRIPT_CODE } from '../../data/appsScriptCode';

export const AnalyticsView: React.FC = () => {
  const { isLecturer, currentUser, loginTeacher } = useAuth();

  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [metrics, setMetrics] = useState<any>(null);
  const [studentProgressList, setStudentProgressList] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

  // Sync state with Google Sheet
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  // Modals
  const [showScriptModal, setShowScriptModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');
  const [importNotice, setImportNotice] = useState<string>('');
  const [isCopiedScript, setIsCopiedScript] = useState<boolean>(false);
  const [detailModalTab, setDetailModalTab] = useState<'quizzes' | 'assignments'>('quizzes');

  // Question analysis
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedAnalysisQuizId, setSelectedAnalysisQuizId] = useState<string>('');
  const [questionAnalysisData, setQuestionAnalysisData] = useState<any[]>([]);
  const [analysisFilter, setAnalysisFilter] = useState<'all' | 'challenging' | 'good'>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const safeFormatDateTime = (dateStr: any): string => {
    if (!dateStr) return 'Chưa ghi nhận';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('vi-VN');
      }
    } catch {}
    return String(dateStr);
  };

  const loadData = () => {
    const ov = AnalyticsService.getOverviewMetrics();
    setMetrics(ov);

    const prog = AnalyticsService.getStudentProgressList();
    setStudentProgressList(prog);

    const qList = QuizService.getPublishedQuizzes();
    setQuizzes(qList);
    if (qList.length > 0 && !selectedAnalysisQuizId) {
      setSelectedAnalysisQuizId(qList[0].id);
      setQuestionAnalysisData(AnalyticsService.getQuestionAnalysis(qList[0].id));
    } else if (selectedAnalysisQuizId) {
      setQuestionAnalysisData(AnalyticsService.getQuestionAnalysis(selectedAnalysisQuizId));
    }
  };

  const syncOnlineData = async () => {
    if (!GoogleSyncService.isConfigured()) {
      setSyncStatus({
        type: 'warning',
        text: 'Chưa cấu hình URL Google Apps Script. Bấm "Cấu hình Google Sync" ở góc trên để kết nối.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const res = await GoogleSyncService.fetchLearningDataOnline();
      if (res && res.success) {
        let countStudents = 0;
        let countAttempts = 0;
        let countSubs = 0;

        if (Array.isArray(res.students) && res.students.length > 0) {
          UserService.mergeRemoteStudents(res.students);
          countStudents = res.students.length;
        }
        if (Array.isArray(res.quizAttempts) && res.quizAttempts.length > 0) {
          QuizService.mergeRemoteAttempts(res.quizAttempts);
          countAttempts = res.quizAttempts.length;
        }
        if (Array.isArray(res.submissions) && res.submissions.length > 0) {
          AssignmentService.mergeRemoteSubmissions(res.submissions);
          countSubs = res.submissions.length;
        }

        const now = new Date().toLocaleTimeString('vi-VN');
        setLastSyncedTime(now);
        setSyncStatus({
          type: 'success',
          text: `Đồng bộ thành công từ Google Sheet lúc ${now}: ${countStudents} sinh viên, ${countAttempts} lượt làm trắc nghiệm, ${countSubs} bài nộp.`,
        });
        loadData();
      } else {
        const err = res?.error || 'Không nhận được dữ liệu';
        if (err.includes('Hành động không hợp lệ') || err.includes('Invalid action')) {
          setSyncStatus({
            type: 'warning',
            text: 'Google Apps Script trên tài khoản của bạn cần cập nhật thêm hàm lấy dữ liệu tự động. Hãy bấm "Cập nhật mã Apps Script" để xem hướng dẫn 1 phút, hoặc bấm "Dán / Nhập dữ liệu từ Sheet" để cập nhật ngay lập tức.',
          });
        } else {
          setSyncStatus({
            type: 'error',
            text: `Không thể đồng bộ từ Google Sheet: ${err}`,
          });
        }
      }
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        text: `Lỗi kết nối đồng bộ: ${err.message || 'Lỗi mạng'}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubSub = subscribe('submissions', loadData);
    const unsubAtt = subscribe('attempts', loadData);
    const unsubUser = subscribe('users', loadData);
    return () => {
      unsubSub();
      unsubAtt();
      unsubUser();
    };
  }, [selectedAnalysisQuizId]);

  // Tự động đồng bộ từ Google Sheet khi mở màn hình Thống kê kết quả
  useEffect(() => {
    if (isLecturer) {
      syncOnlineData();
      const interval = setInterval(() => {
        syncOnlineData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isLecturer]);

  const uniqueClasses = UserService.getUniqueClasses();

  // Filtered students
  const filteredStudents = studentProgressList.filter(s => {
    if (selectedClass !== 'all' && s.studentClass !== selectedClass) return false;
    if (searchStudent.trim()) {
      const q = searchStudent.toLowerCase();
      const matchName = s.studentName.toLowerCase().includes(q);
      const matchId = s.studentId.toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }
    return true;
  });

  const handleExportGradebook = () => {
    exportGradebookToExcel(filteredStudents);
  };

  const handleParsePastedData = () => {
    setImportNotice('');
    const raw = pasteText.trim();
    if (!raw) {
      setImportNotice('Vui lòng dán dữ liệu sao chép từ Google Sheet hoặc tệp JSON vào khung.');
      return;
    }

    try {
      // 1. JSON parse
      if (raw.startsWith('{') || raw.startsWith('[')) {
        try {
          const parsed = JSON.parse(raw);
          let sCount = 0;
          let aCount = 0;
          let subCount = 0;
          if (Array.isArray(parsed)) {
            if (parsed.length > 0 && ('score' in parsed[0] || 'quizTitle' in parsed[0])) {
              QuizService.mergeRemoteAttempts(parsed);
              aCount = parsed.length;
            } else {
              UserService.mergeRemoteStudents(parsed);
              sCount = parsed.length;
            }
          } else if (typeof parsed === 'object') {
            if (parsed.students) {
              UserService.mergeRemoteStudents(parsed.students);
              sCount = parsed.students.length;
            }
            if (parsed.quizAttempts || parsed.attempts) {
              QuizService.mergeRemoteAttempts(parsed.quizAttempts || parsed.attempts);
              aCount = (parsed.quizAttempts || parsed.attempts).length;
            }
            if (parsed.submissions) {
              AssignmentService.mergeRemoteSubmissions(parsed.submissions);
              subCount = parsed.submissions.length;
            }
          }
          setImportNotice(`Đã nạp thành công từ JSON: ${sCount} học viên, ${aCount} kết quả trắc nghiệm, ${subCount} bài nộp.`);
          setPasteText('');
          loadData();
          return;
        } catch {
          // fallback to TSV
        }
      }

      // 2. TSV / CSV parse (directly copied from Google Sheet)
      const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const newStudents: any[] = [];
      const newAttempts: any[] = [];
      const newSubs: any[] = [];

      lines.forEach(line => {
        const parts = line.split(/\t/).map(p => p.trim());
        if (parts.length < 2) return;

        // Skip header lines
        const first = parts[0].toLowerCase();
        const second = (parts[1] || '').toLowerCase();
        if (
          first.includes('thời gian') ||
          first.includes('mã') ||
          second.includes('mã sinh viên') ||
          second.includes('họ và tên')
        ) {
          return;
        }

        // Case A: KetQuaKiemTra (usually 6-12 columns)
        const maybeScore = parts[7] !== undefined ? parseFloat(parts[7]) : NaN;
        const qTitleRaw = parts[5] || '';
        const isQuizRow =
          parts.length >= 6 &&
          (!isNaN(maybeScore) ||
            qTitleRaw.toLowerCase().includes('chương') ||
            qTitleRaw.toLowerCase().includes('bộ câu hỏi') ||
            qTitleRaw.toLowerCase().includes('quy phạm') ||
            qTitleRaw.toLowerCase().includes('quan hệ') ||
            qTitleRaw.toLowerCase().includes('vi phạm') ||
            qTitleRaw.toLowerCase().includes('thực hiện'));

        if (isQuizRow) {
          const sId = (parts[1] || '').toUpperCase();
          const sName = parts[2] || sId;
          const sClass = (parts[3] || '').toUpperCase();
          const qTitle = parts[5] || '';
          const score = !isNaN(maybeScore) ? maybeScore : 0;
          const pct = parts[8] ? parseFloat(parts[8]) : Math.round(score * 10);

          newAttempts.push({
            studentId: sId,
            studentName: sName,
            studentClass: sClass,
            quizTitle: qTitle,
            score,
            percentage: pct,
            correctCount: parts[9] ? parseInt(parts[9]) : Math.round((pct / 100) * 10),
            wrongCount: parts[10] ? parseInt(parts[10]) : 10 - Math.round((pct / 100) * 10),
            durationSeconds: parts[11] ? parseInt(parts[11]) : 0,
            completedAt: parts[0] || new Date().toISOString(),
          });

          newStudents.push({
            studentId: sId,
            displayName: sName,
            studentClass: sClass,
            school: parts[4] || 'Học viện PCCC & CNCH',
          });
          return;
        }

        // Case B: BaiNopTuNghienCuu
        if (
          parts.length >= 6 &&
          (parts[5].toLowerCase().includes('nhiệm vụ') || parts[5].toLowerCase().includes('bài tập'))
        ) {
          const sId = (parts[1] || '').toUpperCase();
          const sName = parts[2] || sId;
          const sClass = (parts[3] || '').toUpperCase();
          newSubs.push({
            studentId: sId,
            studentName: sName,
            studentClass: sClass,
            assignmentTitle: parts[5],
            textContent: parts[6] || '',
            attachedFileName: parts[7] || '',
            submittedAt: parts[0] || new Date().toISOString(),
          });
          newStudents.push({
            studentId: sId,
            displayName: sName,
            studentClass: sClass,
            school: parts[4] || 'Học viện PCCC & CNCH',
          });
          return;
        }

        // Case C: HocVien
        const sId = (parts[1] || parts[0]).toUpperCase();
        const sName = parts[2] || parts[1] || sId;
        const sClass = (parts[3] || '').toUpperCase();
        if (sId && sName) {
          newStudents.push({
            studentId: sId,
            displayName: sName,
            studentClass: sClass,
            school: parts[4] || 'Học viện PCCC & CNCH',
            email: parts[5] || '',
          });
        }
      });

      if (newStudents.length > 0) UserService.mergeRemoteStudents(newStudents);
      if (newAttempts.length > 0) QuizService.mergeRemoteAttempts(newAttempts);
      if (newSubs.length > 0) AssignmentService.mergeRemoteSubmissions(newSubs);

      if (newStudents.length === 0 && newAttempts.length === 0 && newSubs.length === 0) {
        setImportNotice('Không nhận diện được định dạng dữ liệu. Hãy sao chép các hàng từ sheet HocVien hoặc KetQuaKiemTra.');
      } else {
        setImportNotice(`Đã nạp thành công: ${newStudents.length} học viên, ${newAttempts.length} kết quả trắc nghiệm, ${newSubs.length} bài nộp.`);
        setPasteText('');
        loadData();
      }
    } catch (e: any) {
      setImportNotice('Lỗi phân tích cú pháp: ' + e.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = ev.target?.result as string;
        const parsed = JSON.parse(text);
        const ok = importFullDatabase(parsed);
        if (ok) {
          setImportNotice('Đã khôi phục dữ liệu từ tệp sao lưu thành công!');
          loadData();
        } else {
          setImportNotice('Tệp sao lưu không đúng định dạng.');
        }
      } catch {
        setImportNotice('Lỗi đọc tệp sao lưu JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!teacherUsername.trim()) {
      setLoginError('Vui lòng nhập tài khoản giáo viên.');
      return;
    }
    if (!teacherPassword) {
      setLoginError('Vui lòng nhập mật khẩu.');
      return;
    }
    const success = loginTeacher(teacherUsername, teacherPassword);
    if (!success) {
      setLoginError('Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại!');
    }
  };

  // If not logged in as lecturer, show Teacher Authentication lock screen
  if (!isLecturer) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-[#17365D] via-[#1c4373] to-[#245A91] text-white p-7 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-[#F28C28] mx-auto mb-3 border border-white/20 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-serif">Khu vực Thống kê kết quả</h2>
          <p className="text-xs text-slate-200 mt-1">
            Chỉ dành riêng cho tài khoản Giáo viên bộ môn
          </p>
        </div>

        <form onSubmit={handleTeacherLogin} className="p-7 space-y-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl p-4 text-xs leading-relaxed">
            Phần thống kê kết quả học tập và xuất sổ điểm Excel yêu cầu đăng nhập bằng tài khoản Giáo viên.
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-medium">{loginError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tài khoản Giáo viên
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={teacherUsername}
                onChange={e => setTeacherUsername(e.target.value)}
                placeholder="Nhập tài khoản giáo viên"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A91] font-medium"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={teacherPassword}
                onChange={e => setTeacherPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A91] font-medium"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-[#17365D] hover:bg-[#245A91] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg"
            >
              <ShieldCheck className="w-4 h-4 text-[#F28C28]" />
              <span>Đăng nhập xem Thống kê</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ================= LECTURER ANALYTICS DASHBOARD =================
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header & Actions Toolbar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#17365D]" />
            <h1 className="text-xl md:text-2xl font-bold text-[#17365D] font-serif">
              BẢNG THỐNG KÊ & THEO DÕI HỌC TẬP
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
            <span>Tổng hợp kết quả học tập từ Google Sheet & Hệ thống ôn tập trắc nghiệm</span>
            {lastSyncedTime && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Đồng bộ lần cuối: {lastSyncedTime}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={syncOnlineData}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Đồng bộ kết quả mới nhất trực tiếp từ Google Sheet"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-400' : 'text-[#F28C28]'}`} />
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ Google Sheet'}</span>
          </button>

          <button
            onClick={() => {
              setImportNotice('');
              setShowImportModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
            title="Dán dữ liệu sao chép từ Google Sheet hoặc nạp tệp sao lưu"
          >
            <Database className="w-4 h-4" />
            <span>Dán / Nhập từ Sheet</span>
          </button>

          <button
            onClick={() => setShowScriptModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
            title="Xem mã Google Apps Script 2 chiều & hướng dẫn cài đặt"
          >
            <Code2 className="w-4 h-4 text-[#245A91]" />
            <span>Mã Apps Script</span>
          </button>

          <button
            onClick={handleExportGradebook}
            disabled={studentProgressList.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất sổ điểm toàn khóa (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Sync Status Feedback Banner */}
      {syncStatus && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start justify-between gap-3 animate-fadeIn ${
            syncStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : syncStatus.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {syncStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
            {syncStatus.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
            {syncStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
            <div className="leading-relaxed">
              <span className="font-semibold">{syncStatus.text}</span>
              {syncStatus.type === 'warning' && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowScriptModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Cập nhật mã Google Apps Script (1 phút)</span>
                  </button>
                  <button
                    onClick={() => {
                      setImportNotice('');
                      setShowImportModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-[11px] cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Dán dữ liệu trực tiếp từ Sheet</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setSyncStatus(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tổng số sinh viên
            </span>
            <div className="text-2xl md:text-3xl font-extrabold text-[#17365D] mt-1">
              {metrics.totalStudents}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Đã đăng ký tài khoản</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Lượt nộp tự nghiên cứu
            </span>
            <div className="text-2xl md:text-3xl font-extrabold text-[#245A91] mt-1">
              {metrics.totalSubmissions}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Tỷ lệ hoàn thành: <strong className="text-emerald-700">{metrics.completionRate}%</strong>
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Lượt làm trắc nghiệm
            </span>
            <div className="text-2xl md:text-3xl font-extrabold text-[#F28C28] mt-1">
              {metrics.totalAttempts}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Trên {metrics.publishedQuizzes} bài kiểm tra
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Điểm trắc nghiệm trung bình
            </span>
            <div className="text-2xl md:text-3xl font-extrabold text-emerald-700 mt-1">
              {metrics.avgQuizScore}/10
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Toàn bộ sinh viên</p>
          </div>
        </div>
      )}

      {/* Main Student Progress Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#17365D]" />
            <h3 className="font-bold text-base text-[#17365D] font-serif">
              BẢNG TIẾN ĐỘ HỌC TẬP TỪNG SINH VIÊN
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchStudent}
                onChange={e => setSearchStudent(e.target.value)}
                placeholder="Tìm tên, Mã SV..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#245A91]"
              />
            </div>

            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 cursor-pointer"
            >
              <option value="all">Tất cả các lớp</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#17365D] text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-3 py-3 text-center">STT</th>
                <th className="px-3.5 py-3">Mã SV</th>
                <th className="px-3.5 py-3">Họ và tên</th>
                <th className="px-3.5 py-3">Lớp</th>
                <th className="px-3.5 py-3">Nhiệm vụ đã nộp</th>
                <th className="px-3.5 py-3">Tỷ lệ hoàn thành</th>
                <th className="px-3.5 py-3">Điểm TB trắc nghiệm</th>
                <th className="px-3.5 py-3">Đánh giá quá trình</th>
                <th className="px-3.5 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    Chưa có dữ liệu để thống kê hoặc không tìm thấy sinh viên phù hợp.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => (
                  <tr key={s.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-700">{s.studentId}</td>
                    <td className="px-3.5 py-3 font-semibold text-slate-800">{s.studentName}</td>
                    <td className="px-3.5 py-3 text-slate-600 font-medium">{s.studentClass}</td>
                    <td className="px-3.5 py-3">
                      <span className="font-semibold text-slate-800">
                        {s.submittedCount}/{s.totalAssignments} bài
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#245A91] h-1.5 rounded-full"
                            style={{ width: `${s.completionRate}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-700">
                          {s.completionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <span
                        className={`font-bold ${
                          s.avgQuizScore >= 8.0
                            ? 'text-emerald-700'
                            : s.avgQuizScore >= 5.0
                            ? 'text-slate-800'
                            : 'text-amber-700'
                        }`}
                      >
                        {s.avgQuizScore > 0 ? `${s.avgQuizScore}/10` : '--'}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.academicStatus === 'Xuất sắc'
                            ? 'bg-purple-100 text-purple-800'
                            : s.academicStatus === 'Đạt'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.academicStatus === 'Cần cố gắng'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s.academicStatus}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <button
                        onClick={() => setSelectedStudentDetail(s)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Xem
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pedagogical Question Analysis */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-base text-[#17365D] font-serif flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#F28C28]" />
              <span>PHÂN TÍCH TỶ LỆ TRẢ LỜI CÂU HỎI TRẮC NGHIỆM</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đo lường chỉ số chính xác theo thời gian thực, phát hiện câu hỏi học viên hay chọn sai để giảng viên củng cố
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Đề kiểm tra:</span>
              <select
                value={selectedAnalysisQuizId}
                onChange={e => {
                  setSelectedAnalysisQuizId(e.target.value);
                  setQuestionAnalysisData(AnalyticsService.getQuestionAnalysis(e.target.value));
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 font-medium cursor-pointer max-w-xs truncate"
              >
                {quizzes.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Real-time Metrics Dashboard for Selected Quiz */}
        {(() => {
          const selectedQuiz = quizzes.find(q => q.id === selectedAnalysisQuizId) || quizzes[0];
          const selectedQuizAttempts = selectedQuiz ? QuizService.getAttemptsByQuiz(selectedQuiz.id) : [];
          const totalAttemptsCount = selectedQuizAttempts.length;
          const avgScore = totalAttemptsCount > 0
            ? Math.round((selectedQuizAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / totalAttemptsCount) * 10) / 10
            : 0;
          const avgPercentage = totalAttemptsCount > 0
            ? Math.round(selectedQuizAttempts.reduce((acc, a) => acc + (a.percentage || (a.score * 10) || 0), 0) / totalAttemptsCount)
            : 0;
          const challengingCount = questionAnalysisData.filter(q => q.isChallenging).length;
          const goodCount = questionAnalysisData.length - challengingCount;

          const displayedQuestions = questionAnalysisData.filter(q => {
            if (analysisFilter === 'challenging') return q.isChallenging;
            if (analysisFilter === 'good') return !q.isChallenging;
            return true;
          });

          return (
            <div className="space-y-4">
              {/* Summary Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
                  <span className="text-[11px] text-[#17365D] font-medium">Tổng lượt làm bài</span>
                  <div className="text-lg font-bold text-[#17365D] mt-0.5">
                    {totalAttemptsCount} <span className="text-xs font-normal text-slate-500">lượt thi</span>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-medium">Điểm TB toàn bài</span>
                  <div className="text-lg font-bold text-emerald-700 mt-0.5">
                    {avgScore > 0 ? `${avgScore}/10` : '--'}
                  </div>
                </div>

                <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="text-[11px] text-purple-800 font-medium">Tỷ lệ đúng toàn đề</span>
                  <div className="text-lg font-bold text-purple-700 mt-0.5">
                    {avgPercentage > 0 ? `${avgPercentage}%` : '--'}
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[11px] text-amber-800 font-medium">Câu cần củng cố (&lt;60%)</span>
                  <div className="text-lg font-bold text-amber-700 mt-0.5">
                    {challengingCount} <span className="text-xs font-normal text-slate-500">/{questionAnalysisData.length} câu</span>
                  </div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setAnalysisFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      analysisFilter === 'all'
                        ? 'bg-white text-[#17365D] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tất cả ({questionAnalysisData.length})
                  </button>
                  <button
                    onClick={() => setAnalysisFilter('challenging')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                      analysisFilter === 'challenging'
                        ? 'bg-amber-100 text-amber-900 shadow-xs'
                        : 'text-amber-700 hover:text-amber-900'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Cần củng cố ({challengingCount})</span>
                  </button>
                  <button
                    onClick={() => setAnalysisFilter('good')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      analysisFilter === 'good'
                        ? 'bg-emerald-100 text-emerald-900 shadow-xs'
                        : 'text-emerald-700 hover:text-emerald-900'
                    }`}
                  >
                    Đạt chuẩn ({goodCount})
                  </button>
                </div>

                <span className="text-[11px] text-slate-500 italic">
                  Chỉ số cập nhật tự động khi có lượt làm bài mới
                </span>
              </div>

              {/* Question List */}
              {displayedQuestions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  {analysisFilter === 'challenging'
                    ? '🎉 Tuyệt vời! Chưa có câu hỏi nào có tỷ lệ sai cao cần củng cố trong bài kiểm tra này.'
                    : 'Chưa có dữ liệu câu hỏi phù hợp với bộ lọc.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedQuestions.map((q, idx) => {
                    const isExpanded = !!expandedQuestions[q.id];
                    const hasResponses = q.totalResponses > 0;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border transition-all text-xs space-y-2.5 ${
                          q.isChallenging
                            ? 'border-amber-300 bg-amber-50/30'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#17365D] text-sm">Câu {idx + 1}.</span>
                            <span className="text-slate-500 font-medium">{q.topic}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                              {q.difficulty}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {q.isChallenging && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-amber-600" /> Cần củng cố thêm
                              </span>
                            )}
                            <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                              Tỷ lệ đúng:{' '}
                              <strong className={
                                !hasResponses
                                  ? 'text-slate-500'
                                  : q.correctRate >= 75
                                  ? 'text-emerald-700'
                                  : q.correctRate >= 50
                                  ? 'text-amber-700'
                                  : 'text-red-600'
                              }>
                                {hasResponses ? `${q.correctRate}%` : 'Chưa có lượt thi'}
                              </strong>{' '}
                              <span className="text-slate-500 font-normal">
                                ({q.correctCount}/{q.totalResponses} lượt)
                              </span>
                            </span>
                          </div>
                        </div>

                        <p className="text-slate-800 font-medium leading-relaxed">{q.content}</p>

                        {/* Options distribution grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                          {q.options.map((opt: string, optIdx: number) => {
                            const count = q.optionCounts[optIdx] || 0;
                            const percent = q.totalResponses > 0 ? Math.round((count / q.totalResponses) * 100) : 0;
                            const isCorrect = optIdx === q.correctAnswer;

                            return (
                              <div
                                key={optIdx}
                                className={`p-2.5 rounded-lg border text-[11px] transition-colors ${
                                  isCorrect
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-bold'
                                    : 'border-slate-200 bg-slate-50 text-slate-600'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="flex items-center gap-1">
                                    <span>{String.fromCharCode(65 + optIdx)}.</span>
                                    {isCorrect && (
                                      <span className="text-[10px] px-1 rounded bg-emerald-200 text-emerald-800">
                                        ✓ Đáp án đúng
                                      </span>
                                    )}
                                  </span>
                                  <span className="font-mono font-bold text-slate-700">
                                    {hasResponses ? `${percent}%` : '--'}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      isCorrect ? 'bg-emerald-600' : 'bg-slate-400'
                                    }`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                                  <span>{count} lượt chọn</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Expandable Explanation & Legal Basis */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedQuestions(prev => ({
                                ...prev,
                                [q.id]: !prev[q.id],
                              }))
                            }
                            className="text-[11px] text-[#245A91] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Ẩn giải thích & Căn cứ pháp lý' : 'Xem giải thích chi tiết & Căn cứ'}</span>
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-[11px] space-y-1.5 animate-fadeIn">
                              {q.explanation && (
                                <p className="text-slate-800 leading-relaxed">
                                  <strong>Giải thích & Căn cứ:</strong> {q.explanation}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Drilldown Modal for Individual Student Record */}
      {selectedStudentDetail && (() => {
        const studentSubs = AssignmentService.getSubmissions().filter(s =>
          (s.studentUid && selectedStudentDetail.uid && s.studentUid === selectedStudentDetail.uid) ||
          (s.studentId && selectedStudentDetail.studentId && s.studentId.trim().toUpperCase() === selectedStudentDetail.studentId.trim().toUpperCase())
        );

        const studentAttempts = QuizService.getAttempts().filter(a =>
          (a.studentUid && selectedStudentDetail.uid && a.studentUid === selectedStudentDetail.uid) ||
          (a.studentId && selectedStudentDetail.studentId && a.studentId.trim().toUpperCase() === selectedStudentDetail.studentId.trim().toUpperCase())
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#17365D] via-[#1c4373] to-[#245A91] text-white px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base font-serif">Hồ sơ tiến độ học tập chi tiết</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white">
                      {selectedStudentDetail.academicStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span><strong>Học viên:</strong> {selectedStudentDetail.studentName}</span>
                    <span>•</span>
                    <span><strong>Mã SV:</strong> {selectedStudentDetail.studentId}</span>
                    <span>•</span>
                    <span><strong>Lớp:</strong> {selectedStudentDetail.studentClass}</span>
                    {selectedStudentDetail.email && (
                      <>
                        <span>•</span>
                        <span>{selectedStudentDetail.email}</span>
                      </>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudentDetail(null)}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Đóng cửa sổ"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 4 Summary Stat Cards */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 text-center text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Nhiệm vụ đã nộp</span>
                  <div className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">
                    {studentSubs.length}/{selectedStudentDetail.totalAssignments} bài
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Tỷ lệ hoàn thành</span>
                  <div className="text-base sm:text-lg font-bold text-[#245A91] mt-0.5">
                    {selectedStudentDetail.completionRate}%
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Điểm TB trắc nghiệm</span>
                  <div className="text-base sm:text-lg font-bold text-emerald-700 mt-0.5">
                    {selectedStudentDetail.avgQuizScore > 0 ? `${selectedStudentDetail.avgQuizScore}/10` : '--'}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Lượt ôn trắc nghiệm</span>
                  <div className="text-base sm:text-lg font-bold text-[#F28C28] mt-0.5">
                    {studentAttempts.length} lượt
                  </div>
                </div>
              </div>

              {/* Tabs Switcher */}
              <div className="flex border-b border-slate-200 px-6 bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setDetailModalTab('quizzes')}
                  className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    detailModalTab === 'quizzes'
                      ? 'border-[#245A91] text-[#17365D]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Award className="w-4 h-4 text-[#F28C28]" />
                  <span>Kết quả Ôn tập trắc nghiệm ({studentAttempts.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailModalTab('assignments')}
                  className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    detailModalTab === 'assignments'
                      ? 'border-[#245A91] text-[#17365D]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-[#245A91]" />
                  <span>Bài nộp Tự nghiên cứu ({studentSubs.length})</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
                {detailModalTab === 'quizzes' && (
                  <div className="space-y-3">
                    {studentAttempts.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 space-y-2">
                        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="font-medium">Học viên chưa thực hiện lượt ôn tập trắc nghiệm nào trên hệ thống.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#17365D] text-white uppercase text-[10px] tracking-wider font-semibold">
                            <tr>
                              <th className="px-3 py-2.5 text-center">STT</th>
                              <th className="px-3 py-2.5">Bài kiểm tra</th>
                              <th className="px-3 py-2.5 text-center">Điểm số</th>
                              <th className="px-3 py-2.5 text-center">Tỷ lệ đúng</th>
                              <th className="px-3 py-2.5 text-center">Đúng / Sai</th>
                              <th className="px-3 py-2.5 text-center">Thời gian</th>
                              <th className="px-3 py-2.5">Ngày nộp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {studentAttempts.map((att, idx) => (
                              <tr key={att.id || idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-3 py-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                                <td className="px-3 py-2.5 font-semibold text-slate-800">
                                  {QuizService.getQuizById(att.quizId)?.title || (att as any).quizTitle || att.quizId}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    {att.score}/10
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-700">
                                  {att.percentage}%
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className="text-emerald-700 font-semibold">{att.correctCount}Đ</span>
                                  <span className="text-slate-400 mx-1">/</span>
                                  <span className="text-red-600 font-semibold">{att.wrongCount}S</span>
                                </td>
                                <td className="px-3 py-2.5 text-center text-slate-500 font-mono">
                                  {att.durationSeconds > 0
                                    ? att.durationSeconds >= 60
                                      ? `${Math.floor(att.durationSeconds / 60)}p ${att.durationSeconds % 60}s`
                                      : `${att.durationSeconds}s`
                                    : '--'}
                                </td>
                                <td className="px-3 py-2.5 text-slate-500">
                                  {safeFormatDateTime(att.completedAt || att.startedAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {detailModalTab === 'assignments' && (
                  <div className="space-y-3">
                    {studentSubs.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 space-y-2">
                        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="font-medium">Học viên chưa nộp bài tự nghiên cứu nào trên hệ thống.</p>
                      </div>
                    ) : (
                      studentSubs.map((sub, idx) => {
                        const ass = AssignmentService.getById(sub.assignmentId);
                        const title = ass?.title || (sub as any).assignmentTitle || sub.assignmentId || `Nhiệm vụ ${idx + 1}`;
                        return (
                          <div key={sub.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                              <span className="font-bold text-slate-800 text-sm">{title}</span>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sub.score !== undefined ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {sub.score !== undefined ? `Điểm: ${sub.score}/10` : 'Chờ chấm'}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  Nộp: {safeFormatDateTime(sub.submittedAt)}
                                </span>
                              </div>
                            </div>

                            {sub.feedback && (
                              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-slate-700">
                                <strong className="text-emerald-900">Nhận xét của giảng viên:</strong> {sub.feedback}
                              </div>
                            )}

                            {sub.textContent && (
                              <div className="p-3 rounded-lg bg-white border border-slate-200">
                                <span className="font-bold text-slate-600 block mb-1 text-[11px]">Nội dung bài làm:</span>
                                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{sub.textContent}</p>
                              </div>
                            )}

                            {sub.attachedFileName && (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono text-[11px]">
                                <FileText className="w-3.5 h-3.5 text-[#F28C28]" />
                                <span>Tệp đính kèm: <strong>{sub.attachedFileName}</strong></span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-500 italic">
                  Dữ liệu được lưu trữ an toàn và đồng bộ thời gian thực với hệ thống Google Sheet.
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedStudentDetail(null)}
                  className="px-5 py-2 bg-[#17365D] hover:bg-[#245A91] text-white font-semibold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal 1: Nhập dữ liệu thủ công / Dán từ Google Sheet */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-[#17365D] to-[#245A91] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#F28C28]" />
                <div>
                  <h3 className="font-bold text-base font-serif">Dán & Nhập dữ liệu từ Google Sheet</h3>
                  <p className="text-[11px] text-slate-300">Cập nhật tức thì dữ liệu học tập vào hệ thống</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-300 hover:text-white cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-blue-900 leading-relaxed space-y-1.5">
                <div className="font-bold text-[#17365D] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#F28C28]" />
                  <span>Cách lấy dữ liệu nhanh nhất:</span>
                </div>
                <p>
                  Mở Google Sheet của bạn &gt; Vào sheet <strong>KetQuaKiemTra</strong> hoặc <strong>HocVien</strong> &gt; Quét chọn (bôi đen) các hàng dữ liệu &gt; Nhấn <strong>Ctrl+C</strong> và dán (<strong>Ctrl+V</strong>) vào khung dưới đây. Hệ thống sẽ tự động phân tích và đưa vào bảng thống kê ngay lập tức!
                </p>
              </div>

              {importNotice && (
                <div
                  className={`p-3.5 rounded-xl border font-medium flex items-center gap-2 ${
                    importNotice.includes('thành công')
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{importNotice}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Khung dán dữ liệu (Hàng từ Google Sheet hoặc JSON)
                </label>
                <textarea
                  rows={7}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder="Dán các hàng dữ liệu sao chép từ Google Sheet (Ctrl+V) vào đây..."
                  className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#245A91] bg-slate-50"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer text-xs transition">
                  <Upload className="w-3.5 h-3.5 text-[#245A91]" />
                  <span>Nạp tệp JSON sao lưu</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleParsePastedData}
                    className="px-5 py-2 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 text-[#F28C28]" />
                    <span>Nạp vào Thống kê</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Hướng dẫn & Sao chép mã Google Apps Script 2 chiều */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-[#17365D] to-[#245A91] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#F28C28]" />
                <div>
                  <h3 className="font-bold text-base font-serif">Mã Google Apps Script Tự Động 2 Chiều</h3>
                  <p className="text-[11px] text-slate-300">Tự động kéo điểm và bài làm học viên về bảng thống kê</p>
                </div>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-slate-300 hover:text-white cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>3 Bước Cập Nhật Nhanh (Chỉ mất 1 phút):</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1.5 text-emerald-900 leading-relaxed">
                  <li>
                    Mở bảng Google Sheet của bạn &gt; Chọn menu <strong>Tiện ích mở rộng (Extensions)</strong> &gt; <strong>Apps Script</strong>.
                  </li>
                  <li>
                    Bấm nút <strong>"Sao chép toàn bộ mã nguồn"</strong> ở dưới &gt; Xóa sạch mã cũ trong Apps Script và <strong>Dán đè mã mới này vào</strong> &gt; Bấm biểu tượng <strong>Lưu (Ctrl+S)</strong>.
                  </li>
                  <li>
                    Bấm <strong>Triển khai (Deploy)</strong> &gt; <strong>Quản lý bản triển khai (Manage deployments)</strong> &gt; Bấm vào biểu tượng <strong>Cây bút (Chỉnh sửa)</strong> &gt; Mục Phiên bản chọn <strong>Phiên bản mới (New version)</strong> &gt; Bấm nút <strong>Triển khai (Deploy)</strong>.
                  </li>
                </ol>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-medium">Mã nguồn phiên bản mới nhất đã tích hợp hàm <code>getLearningDataFromSheet</code>:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([APPS_SCRIPT_CODE], { type: 'text/javascript' });
                      const u = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = u;
                      a.download = 'GoogleAppsScript_Code.js';
                      a.click();
                      URL.revokeObjectURL(u);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 rotate-180 text-slate-500" />
                    <span>Tải tệp .js</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(APPS_SCRIPT_CODE);
                      setIsCopiedScript(true);
                      setTimeout(() => setIsCopiedScript(false), 3000);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#17365D] hover:bg-[#245A91] text-white font-bold text-xs cursor-pointer shadow-xs transition"
                  >
                    {isCopiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#F28C28]" />}
                    <span>{isCopiedScript ? 'Đã sao chép!' : 'Sao chép toàn bộ mã'}</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute top-2 right-2 text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                  GoogleAppsScript_Code.js (khoảng 800 dòng)
                </div>
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-auto max-h-60 leading-relaxed border border-slate-800">
                  {APPS_SCRIPT_CODE.slice(0, 2000)}
                  {'\n\n/* ... (còn hơn 600 dòng tiếp theo - bấm Sao chép để lấy toàn bộ) ... */'}
                </pre>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowScriptModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold cursor-pointer"
                >
                  Đóng hướng dẫn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
