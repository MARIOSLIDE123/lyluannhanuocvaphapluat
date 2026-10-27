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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AnalyticsService, UserService, QuizService, AssignmentService, subscribe } from '../../services/db';
import { exportGradebookToExcel } from '../../services/excel';

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

  // Question analysis
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedAnalysisQuizId, setSelectedAnalysisQuizId] = useState<string>('');
  const [questionAnalysisData, setQuestionAnalysisData] = useState<any[]>([]);

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
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#17365D]" />
            <h1 className="text-xl md:text-2xl font-bold text-[#17365D] font-serif">
              BẢNG THỐNG KÊ & THEO DÕI HỌC TẬP
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp dữ liệu thực tế từ bài tự nghiên cứu và kết quả ôn tập trắc nghiệm của sinh viên
          </p>
        </div>

        <button
          onClick={handleExportGradebook}
          disabled={studentProgressList.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Xuất sổ điểm toàn khóa (.xlsx)</span>
        </button>
      </div>

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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-[#17365D] font-serif flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#F28C28]" />
              <span>PHÂN TÍCH TỶ LỆ TRẢ LỜI CÂU HỎI TRẮC NGHIỆM</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Phát hiện câu hỏi có tỷ lệ trả lời sai cao để giảng viên củng cố trọng tâm trên lớp
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Chọn bài kiểm tra:</span>
            <select
              value={selectedAnalysisQuizId}
              onChange={e => {
                setSelectedAnalysisQuizId(e.target.value);
                setQuestionAnalysisData(AnalyticsService.getQuestionAnalysis(e.target.value));
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 font-medium cursor-pointer"
            >
              {quizzes.map(q => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {questionAnalysisData.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-500">Chưa có lượt làm bài nào cho bài kiểm tra này.</p>
        ) : (
          <div className="space-y-3">
            {questionAnalysisData.map((q, idx) => (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition-all text-xs space-y-2 ${
                  q.isChallenging
                    ? 'border-amber-300 bg-amber-50/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#17365D]">Câu {idx + 1}.</span>
                    <span className="text-slate-500 font-medium">{q.topic}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {q.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {q.isChallenging && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" /> Cần củng cố thêm
                      </span>
                    )}
                    <span className="font-bold text-slate-700">
                      Đúng: <strong className="text-emerald-700">{q.correctRate}%</strong> ({q.correctCount}/{q.totalResponses} lượt)
                    </span>
                  </div>
                </div>

                <p className="text-slate-800 font-medium leading-relaxed">{q.content}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {q.options.map((opt: string, optIdx: number) => {
                    const count = q.optionCounts[optIdx] || 0;
                    const percent = q.totalResponses > 0 ? Math.round((count / q.totalResponses) * 100) : 0;
                    const isCorrect = optIdx === q.correctAnswer;

                    return (
                      <div
                        key={optIdx}
                        className={`p-2 rounded-lg border text-[11px] ${
                          isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span>{String.fromCharCode(65 + optIdx)} {isCorrect ? '(Đáp án đúng)' : ''}</span>
                          <span className="font-mono font-bold">{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                          <div
                            className={`h-1 rounded-full ${isCorrect ? 'bg-emerald-600' : 'bg-slate-400'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drilldown Modal for Individual Student Record */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-[#17365D] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base font-serif">Hồ sơ quá trình học tập</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedStudentDetail.studentName} • Mã SV: {selectedStudentDetail.studentId} • {selectedStudentDetail.studentClass}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500">Nhiệm vụ đã nộp</span>
                  <div className="text-lg font-bold text-slate-800">
                    {selectedStudentDetail.submittedCount}/{selectedStudentDetail.totalAssignments}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500">Tỷ lệ hoàn thành</span>
                  <div className="text-lg font-bold text-[#245A91]">{selectedStudentDetail.completionRate}%</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500">Điểm TB trắc nghiệm</span>
                  <div className="text-lg font-bold text-emerald-700">{selectedStudentDetail.avgQuizScore}/10</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
                  Các bài tự nghiên cứu của sinh viên:
                </h4>
                <div className="space-y-2">
                  {AssignmentService.getSubmissions()
                    .filter(s => s.studentUid === selectedStudentDetail.uid)
                    .map(sub => {
                      const ass = AssignmentService.getById(sub.assignmentId);
                      return (
                        <div key={sub.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{ass?.title}</span>
                            <span className="text-emerald-700">Điểm: {sub.score !== undefined ? `${sub.score}/10` : 'Chưa chấm'}</span>
                          </div>
                          <p className="text-slate-500 text-[11px]">Nộp lúc: {new Date(sub.submittedAt).toLocaleString('vi-VN')}</p>
                          {sub.feedback && (
                            <p className="text-slate-700 italic bg-white p-2 rounded border border-slate-200">
                              Nhận xét: {sub.feedback}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedStudentDetail(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
