import React, { useState, useEffect } from 'react';
import {
  FileEdit,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  Check,
  Award,
  MessageSquare,
  Users,
  Eye,
  Trash2,
  Edit,
  ExternalLink,
  BookOpen,
  Send,
  HelpCircle,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AssignmentItem, SubmissionItem, UserProfile } from '../../types';
import { AssignmentService, MaterialService, UserService, subscribe } from '../../services/db';
import { GoogleSyncService } from '../../services/googleSync';
import { exportSubmissionsToExcel } from '../../services/excel';
import { ConfirmModal } from '../common/ConfirmModal';
import { DocumentViewerModal } from '../common/DocumentViewerModal';

export const AssignmentsView: React.FC = () => {
  const { isLecturer, currentUser, openTeacherModal } = useAuth();

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');

  // Filtering for lecturer grading table
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');

  // Modals & Active items
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<SubmissionItem | null>(null);
  const [gradingScore, setGradingScore] = useState<string>('');
  const [gradingFeedback, setGradingFeedback] = useState<string>('');

  // Student submission form state
  const [studentTextContent, setStudentTextContent] = useState('');
  const [studentAttachedFile, setStudentAttachedFile] = useState<File | null>(null);
  const [studentAttachedFileName, setStudentAttachedFileName] = useState('');
  const [submissionSuccessMsg, setSubmissionSuccessMsg] = useState('');
  const [submissionErrorMsg, setSubmissionErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assignment Editor Form state
  const [formTitle, setFormTitle] = useState('');
  const [formChapter, setFormChapter] = useState('');
  const [formObjectives, setFormObjectives] = useState('');
  const [formRequirements, setFormRequirements] = useState('');
  const [formGuidingQuestions, setFormGuidingQuestions] = useState<string[]>(['']);
  const [formLinkedMaterials, setFormLinkedMaterials] = useState<string[]>([]);
  const [formDueDate, setFormDueDate] = useState('');
  const [formTargetClasses, setFormTargetClasses] = useState('Tất cả');
  const [formSubmissionType, setFormSubmissionType] = useState<'text' | 'file' | 'both'>('both');
  const [formMaxScore, setFormMaxScore] = useState(10);
  const [formStatus, setFormStatus] = useState<'draft' | 'published' | 'closed'>('published');
  const [editorError, setEditorError] = useState('');

  const loadData = () => {
    const asList = isLecturer ? AssignmentService.getAll() : AssignmentService.getPublished();
    setAssignments(asList);
    setSubmissions(AssignmentService.getSubmissions());
    setStudents(UserService.getStudents());

    if (asList.length > 0 && !selectedAssignmentId) {
      setSelectedAssignmentId(asList[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const unsubAss = subscribe('assignments', loadData);
    const unsubSub = subscribe('submissions', loadData);
    return () => {
      unsubAss();
      unsubSub();
    };
  }, [isLecturer]);

  const activeAssignment = assignments.find(a => a.id === selectedAssignmentId) || assignments[0];

  // Set student form if student already submitted
  useEffect(() => {
    if (!isLecturer && currentUser && activeAssignment) {
      const mySub = AssignmentService.getStudentSubmission(activeAssignment.id, currentUser.uid);
      if (mySub) {
        setStudentTextContent(mySub.textContent || '');
        setStudentAttachedFileName(mySub.attachedFileName || '');
      } else {
        setStudentTextContent('');
        setStudentAttachedFileName('');
        setStudentAttachedFile(null);
      }
      setSubmissionSuccessMsg('');
      setSubmissionErrorMsg('');
    }
  }, [selectedAssignmentId, currentUser, isLecturer]);

  const handleOpenAssignmentEditor = (item?: AssignmentItem) => {
    setEditorError('');
    if (item) {
      setEditingAssignment(item);
      setFormTitle(item.title);
      setFormChapter(item.chapter);
      setFormObjectives(item.objectives);
      setFormRequirements(item.requirements);
      setFormGuidingQuestions(item.guidingQuestions?.length ? item.guidingQuestions : ['']);
      setFormLinkedMaterials(item.linkedMaterialIds || []);
      setFormDueDate(item.dueDate ? item.dueDate.slice(0, 16) : '');
      setFormTargetClasses(item.targetClasses?.join(', ') || 'Tất cả');
      setFormSubmissionType(item.submissionType || 'both');
      setFormMaxScore(item.maxScore || 10);
      setFormStatus(item.status === 'draft' ? 'draft' : item.status === 'closed' ? 'closed' : 'published');
    } else {
      setEditingAssignment(null);
      setFormTitle('');
      setFormChapter('Chương 1: Nguồn gốc và bản chất của Nhà nước');
      setFormObjectives('Yêu cầu sinh viên nắm vững hệ thống kiến thức trước buổi học trên giảng đường.');
      setFormRequirements('Đọc kỹ giáo trình và trả lời các câu hỏi định hướng.');
      setFormGuidingQuestions(['1. Phân tích nội dung cơ bản của bài học?']);
      setFormLinkedMaterials([]);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setFormDueDate(nextWeek.toISOString().slice(0, 16));
      setFormTargetClasses('Tất cả');
      setFormSubmissionType('both');
      setFormMaxScore(10);
      setFormStatus('published');
    }
    setIsEditorOpen(true);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setEditorError('Vui lòng nhập tên nhiệm vụ.');
      return;
    }

    const cleanedQuestions = formGuidingQuestions.map(q => q.trim()).filter(Boolean);
    if (cleanedQuestions.length === 0) {
      setEditorError('Vui lòng nhập ít nhất một câu hỏi định hướng.');
      return;
    }

    AssignmentService.save({
      id: editingAssignment?.id,
      title: formTitle.trim(),
      chapter: formChapter.trim() || 'Chương chung',
      objectives: formObjectives.trim(),
      requirements: formRequirements.trim(),
      guidingQuestions: cleanedQuestions,
      linkedMaterialIds: formLinkedMaterials,
      assignedDate: editingAssignment?.assignedDate || new Date().toISOString(),
      dueDate: new Date(formDueDate || Date.now() + 86400000 * 7).toISOString(),
      targetClasses: formTargetClasses.split(',').map(c => c.trim()).filter(Boolean),
      status: formStatus,
      submissionType: formSubmissionType,
      maxScore: Number(formMaxScore) || 10,
      allowResubmission: true,
      isSample: false,
      createdBy: currentUser?.uid || 'lecturer',
    });

    setIsEditorOpen(false);
  };

  const handleDeleteAssignment = () => {
    if (deletingAssignmentId) {
      AssignmentService.delete(deletingAssignmentId);
      setDeletingAssignmentId(null);
      if (selectedAssignmentId === deletingAssignmentId) {
        const remaining = assignments.filter(a => a.id !== deletingAssignmentId);
        if (remaining.length > 0) setSelectedAssignmentId(remaining[0].id);
      }
    }
  };

  // Student submission handler
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionErrorMsg('');
    setSubmissionSuccessMsg('');

    if (!currentUser) {
      setSubmissionErrorMsg('Vui lòng đăng nhập trước khi nộp bài.');
      return;
    }

    if (!studentTextContent.trim() && !studentAttachedFileName && !studentAttachedFile) {
      setSubmissionErrorMsg('Vui lòng nhập nội dung câu trả lời hoặc đính kèm tệp bài làm.');
      return;
    }

    setIsSubmitting(true);
    try {
      const sub = AssignmentService.submitAssignment({
        assignmentId: activeAssignment.id,
        student: currentUser,
        textContent: studentTextContent.trim(),
        attachedFileName: studentAttachedFile?.name || studentAttachedFileName || undefined,
        attachedFileSize: studentAttachedFile ? `${Math.round(studentAttachedFile.size / 1024)} KB` : undefined,
      });

      // Synchronize in real-time to Google Sheet
      GoogleSyncService.syncSubmission(activeAssignment, sub, currentUser).catch(err => {
        console.warn('Real-time Google Sheet submission sync error:', err);
      });

      setSubmissionSuccessMsg('Nộp bài tự nghiên cứu thành công! Dữ liệu đã được đồng bộ với hệ thống.');
    } catch (err: any) {
      setSubmissionErrorMsg(err.message || 'Lỗi khi lưu bài nộp');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lecturer grading submission
  const handleOpenGrading = (sub: SubmissionItem) => {
    setGradingSubmission(sub);
    setGradingScore(sub.score !== undefined ? String(sub.score) : '');
    setGradingFeedback(sub.feedback || '');
  };

  const handleSaveGrading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    const numScore = parseFloat(gradingScore);
    if (isNaN(numScore) || numScore < 0 || numScore > 10) {
      alert('Vui lòng nhập điểm hợp lệ từ 0 đến 10.');
      return;
    }

    AssignmentService.gradeSubmission(
      gradingSubmission.id,
      numScore,
      gradingFeedback.trim(),
      currentUser?.displayName || 'ThS. Ngô Thị Mai Anh'
    );
    setGradingSubmission(null);
  };

  // Stats for the active assignment
  const activeSubmissions = submissions.filter(s => s.assignmentId === activeAssignment?.id);
  const submittedStudentUids = new Set(activeSubmissions.map(s => s.studentUid));
  const assignedCount = students.length;
  const submittedCount = activeSubmissions.length;
  const unsubmittedCount = Math.max(0, assignedCount - submittedStudentUids.size);
  const lateCount = activeSubmissions.filter(s => s.isLate).length;
  const completionRate = assignedCount > 0 ? Math.round((submittedCount / assignedCount) * 100) : 0;

  // Grade table rows combining student list and their submissions
  const gradeTableData = students
    .map(student => {
      const sub = activeSubmissions.find(s => s.studentUid === student.uid);
      const isSubmitted = !!sub;
      const isLate = sub?.isLate || false;
      const isGraded = sub?.status === 'graded';

      return {
        student,
        sub,
        isSubmitted,
        isLate,
        isGraded,
        submittedAt: sub ? new Date(sub.submittedAt).toLocaleString('vi-VN') : 'Chưa nộp',
        score: sub?.score !== undefined ? sub.score : '',
        feedback: sub?.feedback || '',
      };
    })
    .filter(row => {
      if (filterClass !== 'all' && row.student.studentClass !== filterClass) return false;
      if (filterStatus === 'submitted' && !row.isSubmitted) return false;
      if (filterStatus === 'unsubmitted' && row.isSubmitted) return false;
      if (filterStatus === 'late' && (!row.isSubmitted || !row.isLate)) return false;
      if (filterStatus === 'graded' && (!row.isSubmitted || !row.isGraded)) return false;
      if (filterStatus === 'ungraded' && (!row.isSubmitted || row.isGraded)) return false;
      if (searchStudent.trim()) {
        const q = searchStudent.toLowerCase();
        const matchName = row.student.displayName.toLowerCase().includes(q);
        const matchId = (row.student.studentId || '').toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }
      return true;
    });

  const handleExportExcel = () => {
    if (!activeAssignment) return;
    const exportRows = gradeTableData.map(r => ({
      studentId: r.student.studentId || '',
      studentName: r.student.displayName,
      studentClass: r.student.studentClass || '',
      submittedAt: r.submittedAt,
      isLate: r.isLate,
      status: r.isGraded ? 'graded' : 'ungraded',
      score: r.score,
      feedback: r.feedback,
    }));

    exportSubmissionsToExcel(activeAssignment.title, exportRows);
  };

  const studentMySubmission = !isLecturer && currentUser && activeAssignment
    ? AssignmentService.getStudentSubmission(activeAssignment.id, currentUser.uid)
    : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileEdit className="w-6 h-6 text-[#17365D]" />
            <h1 className="text-xl md:text-2xl font-bold text-[#17365D] font-serif">
              TỰ NGHIÊN CỨU TRƯỚC GIỜ HỌC
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Giao nhiệm vụ chuẩn bị bài, hướng dẫn học liệu và thu nhận bài làm của sinh viên
          </p>
        </div>

        {isLecturer ? (
          <button
            onClick={() => handleOpenAssignmentEditor()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-[#F28C28]" />
            <span>Giao nhiệm vụ mới</span>
          </button>
        ) : (
          <button
            onClick={openTeacherModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            title="Dành cho Giảng viên"
          >
            <ShieldCheck className="w-4 h-4 text-[#F28C28]" />
            <span>Giảng viên giao bài</span>
          </button>
        )}
      </div>

      {/* Main Layout */}
      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileEdit className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-700">Chưa có nhiệm vụ tự nghiên cứu</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isLecturer
              ? 'Thầy/Cô vui lòng nhấn nút "Giao nhiệm vụ mới" để tạo bài tự nghiên cứu đầu tiên.'
              : 'Giảng viên chưa công bố nhiệm vụ tự nghiên cứu cho học phần này.'}
          </p>
          {isLecturer ? (
            <button
              onClick={() => handleOpenAssignmentEditor()}
              className="px-4 py-2 bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer"
            >
              Tạo nhiệm vụ đầu tiên
            </button>
          ) : (
            <button
              onClick={openTeacherModal}
              className="px-4 py-2 bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-[#F28C28]" />
              <span>Đăng nhập Giáo viên để giao nhiệm vụ</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Assignment Selector Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
                Danh sách nhiệm vụ ({assignments.length})
              </h3>
              <div className="space-y-2">
                {assignments.map(a => {
                  const isSelected = selectedAssignmentId === a.id;
                  const isClosed = new Date(a.dueDate).getTime() < Date.now();
                  const mySub = !isLecturer && currentUser
                    ? AssignmentService.getStudentSubmission(a.id, currentUser.uid)
                    : null;

                  return (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAssignmentId(a.id)}
                      className={`p-3 rounded-xl transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#17365D] text-white border-[#17365D] shadow-md'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#17365D]'
                          }`}
                        >
                          {a.chapter.split(':')[0]}
                        </span>
                        {a.isSample && (
                          <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-amber-400/30 text-amber-200' : 'bg-amber-100 text-amber-800'}`}>
                            Mẫu
                          </span>
                        )}
                        {!isLecturer && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              mySub
                                ? isSelected
                                  ? 'bg-emerald-500/30 text-emerald-300'
                                  : 'bg-emerald-100 text-emerald-800'
                                : isSelected
                                ? 'bg-white/10 text-slate-300'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {mySub ? 'Đã nộp' : 'Chưa nộp'}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold line-clamp-2 leading-snug">{a.title}</h4>
                      <p
                        className={`text-[10px] mt-1.5 flex items-center gap-1 ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>Hạn: {new Date(a.dueDate).toLocaleDateString('vi-VN')}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Assignment Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {activeAssignment && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
                {/* Header details of assignment */}
                <div className="border-b border-slate-100 pb-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-[#17365D]">
                        {activeAssignment.chapter}
                      </span>
                      {activeAssignment.isSample && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          DỮ LIỆU MẪU – CHƯA PHẢI NỘI DUNG CHÍNH THỨC
                        </span>
                      )}
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Hạn nộp: <strong>{new Date(activeAssignment.dueDate).toLocaleString('vi-VN')}</strong>
                      </span>
                    </div>

                    {isLecturer && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenAssignmentEditor(activeAssignment)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa</span>
                        </button>
                        <button
                          onClick={() => setDeletingAssignmentId(activeAssignment.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs cursor-pointer"
                          title="Xóa nhiệm vụ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h2 className="text-lg md:text-xl font-bold text-[#17365D] font-serif leading-snug">
                    {activeAssignment.title}
                  </h2>
                </div>

                {/* Objectives and Requirements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <Award className="w-4 h-4 text-[#F28C28]" />
                      Mục tiêu nghiên cứu
                    </span>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                      {activeAssignment.objectives}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <FileText className="w-4 h-4 text-[#245A91]" />
                      Yêu cầu thực hiện
                    </span>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                      {activeAssignment.requirements}
                    </p>
                  </div>
                </div>

                {/* Guiding Questions */}
                <div className="p-5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#17365D] flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-[#245A91]" />
                    <span>HỆ THỐNG CÂU HỎI ĐỊNH HƯỚNG TỰ NGHIÊN CỨU</span>
                  </h3>
                  <div className="space-y-2">
                    {activeAssignment.guidingQuestions.map((q, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-blue-100 text-xs text-slate-800 font-medium leading-relaxed shadow-2xs">
                        {q}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Linked Reading Materials */}
                {activeAssignment.linkedMaterialIds?.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#17365D]" />
                      Học liệu cần đọc liên kết:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activeAssignment.linkedMaterialIds.map(matId => {
                        const mat = MaterialService.getById(matId);
                        return mat ? (
                          <div
                            key={matId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-[#17365D] font-semibold"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#F28C28]" />
                            <span className="truncate max-w-xs">{mat.title}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Student Submission View (Only for Students) */}
                {!isLecturer && (
                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-[#17365D] uppercase tracking-wide flex items-center gap-2">
                        <Send className="w-4 h-4 text-[#F28C28]" />
                        <span>BÀI LÀM TỰ NGHIÊN CỨU CỦA BẠN</span>
                      </h3>
                      {studentMySubmission && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã nộp (Phiên bản {studentMySubmission.version})
                        </span>
                      )}
                    </div>

                    {/* Feedback if graded */}
                    {studentMySubmission?.status === 'graded' && (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
                            <Award className="w-4 h-4 text-[#F28C28]" />
                            Điểm đánh giá: <span className="text-lg font-bold text-emerald-700">{studentMySubmission.score}/10</span>
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            Giảng viên: {studentMySubmission.reviewedBy}
                          </span>
                        </div>
                        {studentMySubmission.feedback && (
                          <div className="text-slate-700 bg-white p-3 rounded-lg border border-emerald-100 mt-1">
                            <strong>Nhận xét:</strong> {studentMySubmission.feedback}
                          </div>
                        )}
                      </div>
                    )}

                    {submissionSuccessMsg && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{submissionSuccessMsg}</span>
                      </div>
                    )}

                    {submissionErrorMsg && (
                      <div className="p-3.5 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{submissionErrorMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleStudentSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          1. Nhập câu trả lời trực tiếp
                        </label>
                        <textarea
                          rows={6}
                          value={studentTextContent}
                          onChange={e => setStudentTextContent(e.target.value)}
                          placeholder="Nhập nội dung trả lời cho các câu hỏi định hướng của giảng viên..."
                          className="w-full p-3.5 rounded-xl border border-slate-300 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#245A91]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          2. Đính kèm tệp bài làm (Word .docx hoặc PDF)
                        </label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <label className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 cursor-pointer flex items-center gap-2 transition-colors">
                            <Upload className="w-4 h-4 text-[#17365D]" />
                            <span>Chọn tệp bài làm</span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.xlsx"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setStudentAttachedFile(file);
                                  setStudentAttachedFileName(file.name);
                                }
                              }}
                              className="hidden"
                            />
                          </label>

                          {studentAttachedFileName && (
                            <span className="text-xs text-slate-600 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-[#F28C28]" />
                              {studentAttachedFileName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 italic">
                          Họ tên ({currentUser?.displayName}) và Mã SV ({currentUser?.studentId || 'Chưa cập nhật'}) sẽ được lưu cùng bài nộp.
                        </span>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-2.5 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-4 h-4 text-[#F28C28]" />
                          <span>{isSubmitting ? 'Đang lưu...' : studentMySubmission ? 'Cập nhật bài nộp lại' : 'Nộp bài tự nghiên cứu'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Lecturer Submissions Evaluation Table */}
            {isLecturer && activeAssignment && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
                {/* Statistics Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium">Được giao</span>
                    <div className="text-lg font-bold text-slate-800">{assignedCount} sinh viên</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[11px] text-emerald-700 font-medium">Đã nộp bài</span>
                    <div className="text-lg font-bold text-emerald-800">{submittedCount} lượt</div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[11px] text-amber-700 font-medium">Chưa nộp</span>
                    <div className="text-lg font-bold text-amber-800">{unsubmittedCount} sinh viên</div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <span className="text-[11px] text-blue-700 font-medium">Tỷ lệ hoàn thành</span>
                    <div className="text-lg font-bold text-[#17365D]">{completionRate}%</div>
                  </div>
                </div>

                {/* Filter and Export Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-48">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchStudent}
                        onChange={e => setSearchStudent(e.target.value)}
                        placeholder="Tìm SV, Mã SV..."
                        className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#245A91]"
                      />
                    </div>

                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 cursor-pointer"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="submitted">Đã nộp</option>
                      <option value="unsubmitted">Chưa nộp</option>
                      <option value="late">Nộp muộn</option>
                      <option value="graded">Đã chấm điểm</option>
                      <option value="ungraded">Chưa chấm điểm</option>
                    </select>
                  </div>

                  <button
                    onClick={handleExportExcel}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Xuất bảng điểm Excel (.xlsx)</span>
                  </button>
                </div>

                {/* Submissions Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#17365D] text-white uppercase text-[10px] tracking-wider font-semibold">
                      <tr>
                        <th className="px-3.5 py-3">Mã SV</th>
                        <th className="px-3.5 py-3">Họ và tên</th>
                        <th className="px-3.5 py-3">Lớp</th>
                        <th className="px-3.5 py-3">Thời gian nộp</th>
                        <th className="px-3.5 py-3">Trạng thái</th>
                        <th className="px-3.5 py-3">Điểm</th>
                        <th className="px-3.5 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gradeTableData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                            Không có bản ghi sinh viên nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        gradeTableData.map(row => (
                          <tr key={row.student.uid} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3.5 py-3 font-mono font-bold text-slate-700">
                              {row.student.studentId || 'Chưa có'}
                            </td>
                            <td className="px-3.5 py-3 font-semibold text-slate-800">
                              {row.student.displayName}
                            </td>
                            <td className="px-3.5 py-3 text-slate-600 font-medium">
                              {row.student.studentClass || 'Chưa phân lớp'}
                            </td>
                            <td className="px-3.5 py-3 text-slate-500 text-[11px]">
                              {row.submittedAt}
                            </td>
                            <td className="px-3.5 py-3">
                              {row.isSubmitted ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                    row.isLate
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {row.isLate ? 'Nộp muộn' : 'Đúng hạn'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                  Chưa nộp
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-3 font-bold text-slate-800">
                              {row.score !== '' ? (
                                <span className="text-emerald-700">{row.score}/10</span>
                              ) : (
                                <span className="text-slate-400 font-normal">--</span>
                              )}
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              {row.sub ? (
                                <button
                                  onClick={() => handleOpenGrading(row.sub!)}
                                  className="px-3 py-1 rounded bg-[#17365D] hover:bg-[#245A91] text-white text-[11px] font-semibold transition-colors cursor-pointer"
                                >
                                  {row.isGraded ? 'Xem & Chấm lại' : 'Chấm bài'}
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Chưa nộp</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grading & Detailed Submission Modal for Lecturer */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-[#17365D] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base">Đánh giá bài tự nghiên cứu</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sinh viên: <strong>{gradingSubmission.studentName}</strong> ({gradingSubmission.studentId}) • {gradingSubmission.studentClass}
                </p>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="text-slate-300 hover:text-white cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span>
                  Thời gian nộp: <strong>{new Date(gradingSubmission.submittedAt).toLocaleString('vi-VN')}</strong>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    gradingSubmission.isLate ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {gradingSubmission.isLate ? 'Nộp muộn' : 'Đúng hạn'} • Bản {gradingSubmission.version}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nội dung câu trả lời của sinh viên:
                </label>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 whitespace-pre-line text-slate-800 leading-relaxed font-sans max-h-56 overflow-y-auto">
                  {gradingSubmission.textContent || 'Sinh viên không nhập văn bản trực tiếp (nộp tệp đính kèm).'}
                </div>
              </div>

              {gradingSubmission.attachedFileName && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#245A91]" />
                    <span className="font-semibold text-slate-800">{gradingSubmission.attachedFileName}</span>
                    {gradingSubmission.attachedFileSize && (
                      <span className="text-slate-500">({gradingSubmission.attachedFileSize})</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      // Trigger download of submission file
                      const blob = new Blob([gradingSubmission.textContent || 'Bài làm của sinh viên ' + gradingSubmission.studentName], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = gradingSubmission.attachedFileName || 'Bai_lam.txt';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1 bg-[#17365D] hover:bg-[#245A91] text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải tệp bài làm</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveGrading} className="pt-3 border-t border-slate-200 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Điểm đánh giá (0 - 10) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      required
                      value={gradingScore}
                      onChange={e => setGradingScore(e.target.value)}
                      placeholder="8.5"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-[#245A91]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nhận xét của Giảng viên:
                  </label>
                  <textarea
                    rows={3}
                    value={gradingFeedback}
                    onChange={e => setGradingFeedback(e.target.value)}
                    placeholder="Nhập nhận xét về ưu điểm, hạn chế và gợi ý cải thiện..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#245A91]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setGradingSubmission(null)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#17365D] hover:bg-[#245A91] text-white font-bold rounded-lg cursor-pointer"
                  >
                    Lưu kết quả chấm
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Editor Modal for Lecturer */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-[#17365D] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base font-serif">
                {editingAssignment ? 'Chỉnh sửa nhiệm vụ tự nghiên cứu' : 'Tạo nhiệm vụ tự nghiên cứu mới'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-6 overflow-y-auto space-y-4">
              {editorError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                  {editorError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên nhiệm vụ tự nghiên cứu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Nhiệm vụ 01: Nghiên cứu nguồn gốc và bản chất của Nhà nước..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#245A91]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Chương / Bài học liên quan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formChapter}
                    onChange={e => setFormChapter(e.target.value)}
                    placeholder="Chương 1: Nguồn gốc và bản chất..."
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hạn nộp bài <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formDueDate}
                    onChange={e => setFormDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mục tiêu nghiên cứu
                </label>
                <textarea
                  rows={2}
                  value={formObjectives}
                  onChange={e => setFormObjectives(e.target.value)}
                  placeholder="Mục tiêu kiến thức sinh viên cần đạt được..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Yêu cầu thực hiện
                </label>
                <textarea
                  rows={2}
                  value={formRequirements}
                  onChange={e => setFormRequirements(e.target.value)}
                  placeholder="Hướng dẫn sinh viên đọc tài liệu, hình thức nộp..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              {/* Dynamic Guiding Questions */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Hệ thống câu hỏi định hướng <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormGuidingQuestions([...formGuidingQuestions, ''])}
                    className="text-[11px] font-bold text-[#245A91] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm câu hỏi</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {formGuidingQuestions.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400 w-5 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        value={q}
                        onChange={e => {
                          const updated = [...formGuidingQuestions];
                          updated[idx] = e.target.value;
                          setFormGuidingQuestions(updated);
                        }}
                        placeholder={`Câu hỏi định hướng số ${idx + 1}...`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                      {formGuidingQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormGuidingQuestions(formGuidingQuestions.filter((_, i) => i !== idx));
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hình thức nộp bài
                  </label>
                  <select
                    value={formSubmissionType}
                    onChange={e => setFormSubmissionType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="both">Nhập văn bản HOẶC Tải tệp (Kết hợp)</option>
                    <option value="text">Chỉ nhập văn bản trực tiếp</option>
                    <option value="file">Chỉ tải tệp đính kèm (Word/PDF)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Trạng thái công bố
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                  >
                    <option value="published">Đã công bố (Sinh viên nộp bài được)</option>
                    <option value="draft">Bản nháp (Chưa công bố)</option>
                    <option value="closed">Đóng nhận bài</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Lưu nhiệm vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingAssignmentId}
        title="Xóa nhiệm vụ tự nghiên cứu"
        message="Thầy/Cô có chắc chắn muốn xóa nhiệm vụ này? Tất cả các bài nộp của sinh viên cho nhiệm vụ này cũng sẽ bị xóa. Thao tác không thể hoàn tác."
        confirmText="Xóa vĩnh viễn"
        isDanger={true}
        onConfirm={handleDeleteAssignment}
        onCancel={() => setDeletingAssignmentId(null)}
      />
    </div>
  );
};
