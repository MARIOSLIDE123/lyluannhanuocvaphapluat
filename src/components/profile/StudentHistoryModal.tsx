import React, { useState } from 'react';
import {
  GraduationCap,
  Clock,
  Award,
  CheckCircle2,
  BookOpen,
  Calendar,
  X,
  Activity,
  FileText,
  Building2,
  ExternalLink,
  Edit3,
  CloudCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { QuizService, AssignmentService } from '../../services/db';
import { GoogleSyncService } from '../../services/googleSync';

export const StudentHistoryModal: React.FC = () => {
  const {
    studentProfile,
    isStudentHistoryModalOpen,
    closeStudentHistoryModal,
    openStudentModal,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'quizzes' | 'assignments' | 'activity'>('quizzes');

  if (!isStudentHistoryModalOpen || !studentProfile) return null;

  // Real-time calculations
  const myAttempts = QuizService.getAttempts().filter(
    a => a.studentUid === studentProfile.uid
  );
  const mySubmissions = AssignmentService.getSubmissions().filter(
    s => s.studentUid === studentProfile.uid
  );

  const totalStudyMinutes = GoogleSyncService.getTotalStudyMinutes();
  const activities = GoogleSyncService.getLocalActivities();

  // Average quiz score
  const avgScore =
    myAttempts.length > 0
      ? Math.round(
          (myAttempts.reduce((sum, a) => sum + a.score, 0) / myAttempts.length) * 10
        ) / 10
      : 0;

  const isCloudSynced = GoogleSyncService.isConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#17365D] via-[#1c4373] to-[#245A91] text-white p-6 relative shrink-0">
          <button
            onClick={closeStudentHistoryModal}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-[#F28C28] shadow-inner border border-white/20 shrink-0">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-serif text-white">
                    {studentProfile.displayName}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                    {studentProfile.studentClass || 'Học viên'}
                  </span>
                </div>
                <div className="text-xs text-slate-200 mt-1 flex flex-wrap items-center gap-3">
                  <span>Mã SV: <strong className="font-mono text-amber-200">{studentProfile.studentId}</strong></span>
                  <span>•</span>
                  <span>Trường: <strong className="text-white">{studentProfile.school || 'Học viện PCCC & CNCH'}</strong></span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                closeStudentHistoryModal();
                openStudentModal();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-300" />
              <span>Sửa thông tin</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3.5 shrink-0">
          <div className="p-3.5 bg-white rounded-2xl shadow-xs border border-slate-200 text-center">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#17365D] flex items-center justify-center mx-auto mb-1.5">
              <Award className="w-4 h-4 text-[#F28C28]" />
            </div>
            <div className="text-xl font-extrabold text-[#17365D]">{avgScore}/10</div>
            <div className="text-[11px] text-slate-500 font-medium">Điểm TB trắc nghiệm</div>
          </div>

          <div className="p-3.5 bg-white rounded-2xl shadow-xs border border-slate-200 text-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-emerald-700">
              {totalStudyMinutes >= 60 ? `${Math.floor(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}p` : `${totalStudyMinutes} phút`}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Thời gian học tích lũy</div>
          </div>

          <div className="p-3.5 bg-white rounded-2xl shadow-xs border border-slate-200 text-center">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center mx-auto mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#F28C28]" />
            </div>
            <div className="text-xl font-extrabold text-[#17365D]">{myAttempts.length}</div>
            <div className="text-[11px] text-slate-500 font-medium">Lượt ôn trắc nghiệm</div>
          </div>

          <div className="p-3.5 bg-white rounded-2xl shadow-xs border border-slate-200 text-center">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center mx-auto mb-1.5">
              <BookOpen className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-extrabold text-[#17365D]">{mySubmissions.length}</div>
            <div className="text-[11px] text-slate-500 font-medium">Bài tự nghiên cứu</div>
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {isCloudSynced
                ? 'Dữ liệu học tập đang được đồng bộ theo thời gian thực vào Google Sheet & Google Drive.'
                : 'Dữ liệu học tập được lưu cục bộ và sẵn sàng đồng bộ vào Google Sheet.'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Cập nhật: {new Date().toLocaleTimeString('vi-VN')}
          </span>
        </div>

        {/* Tabs Header */}
        <div className="flex border-b border-slate-200 px-6 bg-white shrink-0">
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quizzes'
                ? 'border-[#245A91] text-[#17365D]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Ôn tập trắc nghiệm ({myAttempts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'assignments'
                ? 'border-[#245A91] text-[#17365D]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Bài tự nghiên cứu ({mySubmissions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'border-[#245A91] text-[#17365D]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Lịch sử hoạt động ({activities.length})</span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'quizzes' && (
            <div className="space-y-3">
              {myAttempts.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  Bạn chưa tham gia bài kiểm tra trắc nghiệm nào.
                </div>
              ) : (
                myAttempts.map(att => {
                  const quiz = QuizService.getQuizById(att.quizId);
                  return (
                    <div
                      key={att.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-[#17365D]">{quiz?.title || 'Bài kiểm tra trắc nghiệm'}</h4>
                        <span className="text-base font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                          {att.score}/10
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
                        <span>Đúng: <strong className="text-emerald-700">{att.correctCount}</strong> câu</span>
                        <span>•</span>
                        <span>Sai: <strong className="text-red-600">{att.wrongCount}</strong> câu</span>
                        <span>•</span>
                        <span>Tỷ lệ: <strong>{att.percentage}%</strong></span>
                        <span>•</span>
                        <span>Thời gian: {att.durationSeconds} giây</span>
                        <span>•</span>
                        <span className="font-mono">{new Date(att.startedAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-3">
              {mySubmissions.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  Bạn chưa nộp bài tự nghiên cứu nào.
                </div>
              ) : (
                mySubmissions.map(sub => {
                  const ass = AssignmentService.getById(sub.assignmentId);
                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-[#17365D]">{ass?.title || 'Nhiệm vụ tự nghiên cứu'}</h4>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#17365D]">
                          {sub.status === 'graded' ? `Điểm: ${sub.score}/10` : 'Đã nộp'}
                        </span>
                      </div>
                      {sub.textContent && (
                        <p className="text-xs text-slate-700 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {sub.textContent}
                        </p>
                      )}
                      {sub.attachedFileName && (
                        <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                          <FileText className="w-3.5 h-3.5 text-[#F28C28]" />
                          <span>Tệp đính kèm: {sub.attachedFileName}</span>
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 font-mono pt-1">
                        Thời gian nộp: {new Date(sub.submittedAt).toLocaleString('vi-VN')} {sub.isLate && '(Nộp muộn)'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-2.5">
              {activities.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  Chưa ghi nhận hoạt động nào.
                </div>
              ) : (
                activities.map(act => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-[#F28C28]" />
                      <span className="font-medium text-slate-800">{act.description}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                      {new Date(act.timestamp).toLocaleTimeString('vi-VN')} - {new Date(act.timestamp).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500">
            Học phần: <strong>Lý luận Nhà nước và Pháp luật</strong> (Khoa Luật - PCCC & CNCH)
          </span>
          <button
            onClick={closeStudentHistoryModal}
            className="px-5 py-2 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white font-bold cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
