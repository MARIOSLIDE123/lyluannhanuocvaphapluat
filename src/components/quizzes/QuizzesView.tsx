import React, { useState, useEffect, useRef } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileSpreadsheet,
  Download,
  Upload,
  Sparkles,
  Search,
  RotateCcw,
  Eye,
  Trash2,
  Edit,
  ArrowRight,
  ArrowLeft,
  Check,
  Send,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { QuizItem, QuizQuestion, QuizAttempt, QuestionDifficulty } from '../../types';
import { QuizService, subscribe } from '../../services/db';
import { GoogleSyncService } from '../../services/googleSync';
import { downloadQuestionTemplate, parseAndValidateQuestionsFile, QuestionValidationResult } from '../../services/excel';
import { extractQuestionsFromText, ExtractedQuestionDraft } from '../../services/gemini';
import { ConfirmModal } from '../common/ConfirmModal';

export const QuizzesView: React.FC = () => {
  const { isLecturer, currentUser, openTeacherModal } = useAuth();

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizItem | null>(null);

  // Active taking exam state
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [examStartedAt, setExamStartedAt] = useState<string>('');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [recentAttempt, setRecentAttempt] = useState<QuizAttempt | null>(null);
  const [showResultReview, setShowResultReview] = useState(false);

  // Lecturer Management Modals
  const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizItem | null>(null);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);
  const [isQuestionsManagerOpen, setIsQuestionsManagerOpen] = useState(false);
  const [questionsManagerQuiz, setQuestionsManagerQuiz] = useState<QuizItem | null>(null);
  const [managedQuestions, setManagedQuestions] = useState<QuizQuestion[]>([]);

  // Bulk Import from Excel Modal
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [importValidationResults, setImportValidationResults] = useState<QuestionValidationResult[]>([]);
  const [isImportValidating, setIsImportValidating] = useState(false);
  const [importError, setImportError] = useState('');

  // Gemini AI Extraction Modal
  const [isAIExtractOpen, setIsAIExtractOpen] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [aiDraftQuestions, setAiDraftQuestions] = useState<ExtractedQuestionDraft[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState('');

  // Manual Question Editor Form (single question)
  const [isSingleQuestionEditorOpen, setIsSingleQuestionEditorOpen] = useState(false);
  const [editingSingleQuestion, setEditingSingleQuestion] = useState<QuizQuestion | null>(null);
  const [sqContent, setSqContent] = useState('');
  const [sqOptions, setSqOptions] = useState<string[]>(['', '', '', '']);
  const [sqCorrectAnswer, setSqCorrectAnswer] = useState<number>(0);
  const [sqExplanation, setSqExplanation] = useState('');
  const [sqTopic, setSqTopic] = useState('Lý luận chung');
  const [sqDifficulty, setSqDifficulty] = useState<QuestionDifficulty>('Thông hiểu');
  const [sqPoints, setSqPoints] = useState<number>(1);
  const [sqError, setSqError] = useState('');

  // Quiz Form state
  const [qfTitle, setQfTitle] = useState('');
  const [qfChapter, setQfChapter] = useState('Chương 1');
  const [qfInstructions, setQfInstructions] = useState('');
  const [qfDuration, setQfDuration] = useState(15);
  const [qfMaxAttempts, setQfMaxAttempts] = useState(2);
  const [qfViewScore, setQfViewScore] = useState<'immediate' | 'on_close'>('immediate');
  const [qfViewAnswers, setQfViewAnswers] = useState<'after_submit' | 'on_close' | 'never'>('after_submit');
  const [qfStatus, setQfStatus] = useState<'draft' | 'published'>('published');
  const [qfError, setQfError] = useState('');

  const timerRef = useRef<any>(null);

  const loadQuizzes = () => {
    const list = isLecturer ? QuizService.getQuizzes() : QuizService.getPublishedQuizzes();
    setQuizzes(list);
    if (list.length > 0 && !selectedQuiz) {
      setSelectedQuiz(list[0]);
    }
  };

  useEffect(() => {
    loadQuizzes();
    const unsubQ = subscribe('quizzes', loadQuizzes);
    const unsubQuest = subscribe('questions', () => {
      if (questionsManagerQuiz) {
        setManagedQuestions(QuizService.getQuestionsByQuiz(questionsManagerQuiz.id));
      }
    });
    return () => {
      unsubQ();
      unsubQuest();
    };
  }, [isLecturer]);

  // Countdown timer for active exam
  useEffect(() => {
    if (isTakingQuiz && selectedQuiz && selectedQuiz.durationMinutes > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmitOnExpiry();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTakingQuiz]);

  const handleStartExam = (quiz: QuizItem) => {
    const questions = QuizService.getQuestionsByQuiz(quiz.id);
    if (questions.length === 0) {
      alert('Bài kiểm tra này chưa có câu hỏi. Giảng viên vui lòng bổ sung câu hỏi.');
      return;
    }

    // Check attempts limit
    if (!isLecturer && currentUser) {
      const myAttempts = QuizService.getStudentAttempts(quiz.id, currentUser.uid);
      if (quiz.maxAttempts > 0 && myAttempts.length >= quiz.maxAttempts) {
        alert(`Bạn đã đạt giới hạn tối đa ${quiz.maxAttempts} lần làm bài kiểm tra này.`);
        return;
      }
    }

    setSelectedQuiz(quiz);
    setActiveQuizQuestions(questions);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    const startTime = new Date().toISOString();
    setExamStartedAt(startTime);
    setTimeLeftSeconds(quiz.durationMinutes > 0 ? quiz.durationMinutes * 60 : 0);
    setRecentAttempt(null);
    setShowResultReview(false);
    setIsTakingQuiz(true);
  };

  const handleSelectAnswer = (qId: string, optIndex: number) => {
    // Khóa câu trả lời sau lần chọn đầu tiên trong lượt luyện tập đó
    if (userAnswers[qId] !== undefined) return;
    setUserAnswers(prev => ({
      ...prev,
      [qId]: optIndex,
    }));
  };

  const handleAutoSubmitOnExpiry = () => {
    alert('Hết giờ làm bài! Hệ thống đang tự động ghi nhận bài làm của bạn.');
    finishExamSubmission();
  };

  const handleManualSubmit = () => {
    setShowSubmitConfirm(true);
  };

  const finishExamSubmission = () => {
    if (!selectedQuiz || !currentUser) return;
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const attempt = QuizService.submitQuizAttempt({
        quizId: selectedQuiz.id,
        student: currentUser,
        answers: userAnswers,
        startedAt: examStartedAt,
      });

      // Synchronize to Google Sheet in real-time
      GoogleSyncService.syncQuizAttempt(selectedQuiz, attempt, currentUser).catch(err => {
        console.warn('Real-time Google Sheet quiz sync error:', err);
      });

      setRecentAttempt(attempt);
      setIsTakingQuiz(false);
      setShowSubmitConfirm(false);
      setShowResultReview(true);
    } catch (err: any) {
      alert('Lỗi nộp bài: ' + err.message);
    }
  };

  // Open Quiz form
  const handleOpenQuizEditor = (quiz?: QuizItem) => {
    setQfError('');
    if (quiz) {
      setEditingQuiz(quiz);
      setQfTitle(quiz.title);
      setQfChapter(quiz.chapter);
      setQfInstructions(quiz.instructions);
      setQfDuration(quiz.durationMinutes);
      setQfMaxAttempts(quiz.maxAttempts);
      setQfViewScore(quiz.viewScoreMode);
      setQfViewAnswers(quiz.viewAnswersMode);
      setQfStatus(quiz.status === 'draft' ? 'draft' : 'published');
    } else {
      setEditingQuiz(null);
      setQfTitle('');
      setQfChapter('Chương 1: Nguồn gốc và bản chất Nhà nước');
      setQfInstructions('Bài kiểm tra trắc nghiệm củng cố kiến thức. Học viên chọn 01 phương án đúng nhất cho mỗi câu hỏi.');
      setQfDuration(15);
      setQfMaxAttempts(2);
      setQfViewScore('immediate');
      setQfViewAnswers('after_submit');
      setQfStatus('published');
    }
    setIsQuizEditorOpen(true);
  };

  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qfTitle.trim()) {
      setQfError('Vui lòng nhập tên bài kiểm tra.');
      return;
    }

    const saved = QuizService.saveQuiz({
      id: editingQuiz?.id,
      title: qfTitle.trim(),
      chapter: qfChapter.trim(),
      instructions: qfInstructions.trim(),
      durationMinutes: Number(qfDuration) || 0,
      maxAttempts: Number(qfMaxAttempts) || 0,
      viewScoreMode: qfViewScore,
      viewAnswersMode: qfViewAnswers,
      targetClasses: ['Tất cả'],
      status: qfStatus,
      passingScore: 5.0,
      isSample: false,
      createdBy: currentUser?.uid || 'lecturer',
    });

    setIsQuizEditorOpen(false);
    setSelectedQuiz(saved);
  };

  const handleDeleteQuiz = () => {
    if (deletingQuizId) {
      QuizService.deleteQuiz(deletingQuizId);
      setDeletingQuizId(null);
      if (selectedQuiz?.id === deletingQuizId) {
        const remaining = quizzes.filter(q => q.id !== deletingQuizId);
        setSelectedQuiz(remaining.length > 0 ? remaining[0] : null);
      }
    }
  };

  // Open Question Manager
  const handleOpenQuestionsManager = (quiz: QuizItem) => {
    setQuestionsManagerQuiz(quiz);
    setManagedQuestions(QuizService.getQuestionsByQuiz(quiz.id));
    setIsQuestionsManagerOpen(true);
  };

  // Excel Bulk Import File Change
  const handleExcelFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportValidating(true);
    setImportError('');
    try {
      const { results, totalValid, totalInvalid } = await parseAndValidateQuestionsFile(file);
      setImportValidationResults(results);
      if (totalValid === 0) {
        setImportError('Không tìm thấy câu hỏi hợp lệ trong tệp. Vui lòng kiểm tra lại cấu trúc các cột.');
      }
    } catch (err: any) {
      setImportError(err.message || 'Lỗi đọc tệp Excel/CSV');
    } finally {
      setIsImportValidating(false);
    }
  };

  const handleSaveImportedQuestions = () => {
    if (!questionsManagerQuiz) return;
    const validQuestions = importValidationResults
      .filter(r => r.valid && r.parsed)
      .map(r => ({
        ...r.parsed!,
        quizId: questionsManagerQuiz.id,
      }));

    if (validQuestions.length === 0) return;

    QuizService.bulkSaveQuestions(validQuestions);
    setImportValidationResults([]);
    setIsExcelImportOpen(false);
    setManagedQuestions(QuizService.getQuestionsByQuiz(questionsManagerQuiz.id));
  };

  // AI Question Extraction
  const handleExtractWithAI = async () => {
    if (!aiInputText.trim()) return;
    setIsAiLoading(true);
    setAiNotice('');
    try {
      const res = await extractQuestionsFromText(aiInputText);
      setAiDraftQuestions(res.questions);
      if (res.message) setAiNotice(res.message);
    } catch (e: any) {
      setAiNotice('Lỗi phân tích: ' + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveAIDraftQuestions = () => {
    if (!questionsManagerQuiz) return;
    const finalQuestions: Omit<QuizQuestion, 'id'>[] = aiDraftQuestions.map((draft, idx) => ({
      quizId: questionsManagerQuiz.id,
      content: draft.question,
      options: draft.options,
      correctAnswer: draft.correctAnswer !== null ? draft.correctAnswer : 0, // Default to A if not set
      questionType: 'single',
      points: 1,
      explanation: draft.explanation,
      topic: draft.topic,
      difficulty: draft.difficulty,
      order: managedQuestions.length + idx + 1,
    }));

    QuizService.bulkSaveQuestions(finalQuestions);
    setAiDraftQuestions([]);
    setAiInputText('');
    setIsAIExtractOpen(false);
    setManagedQuestions(QuizService.getQuestionsByQuiz(questionsManagerQuiz.id));
  };

  // Manual Question Editor
  const handleOpenSingleQuestionEditor = (q?: QuizQuestion) => {
    setSqError('');
    if (q) {
      setEditingSingleQuestion(q);
      setSqContent(q.content);
      setSqOptions(q.options);
      setSqCorrectAnswer(q.correctAnswer);
      setSqExplanation(q.explanation);
      setSqTopic(q.topic);
      setSqDifficulty(q.difficulty);
      setSqPoints(q.points || 1);
    } else {
      setEditingSingleQuestion(null);
      setSqContent('');
      setSqOptions(['', '', '', '']);
      setSqCorrectAnswer(0);
      setSqExplanation('');
      setSqTopic('Lý luận Nhà nước');
      setSqDifficulty('Thông hiểu');
      setSqPoints(1);
    }
    setIsSingleQuestionEditorOpen(true);
  };

  const handleSaveSingleQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sqContent.trim()) {
      setSqError('Vui lòng nhập nội dung câu hỏi.');
      return;
    }
    const cleanOpts = sqOptions.map(o => o.trim()).filter(Boolean);
    if (cleanOpts.length < 2) {
      setSqError('Vui lòng nhập ít nhất 2 phương án trả lời.');
      return;
    }

    if (!questionsManagerQuiz) return;

    QuizService.saveQuestion({
      id: editingSingleQuestion?.id,
      quizId: questionsManagerQuiz.id,
      content: sqContent.trim(),
      options: cleanOpts,
      correctAnswer: sqCorrectAnswer,
      questionType: 'single',
      points: Number(sqPoints) || 1,
      explanation: sqExplanation.trim(),
      topic: sqTopic.trim(),
      difficulty: sqDifficulty,
      order: editingSingleQuestion?.order || managedQuestions.length + 1,
    });

    setIsSingleQuestionEditorOpen(false);
    setManagedQuestions(QuizService.getQuestionsByQuiz(questionsManagerQuiz.id));
  };

  // Format timer MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  // ================= RENDER ACTIVE EXAM SCREEN =================
  if (isTakingQuiz && selectedQuiz) {
    const currentQ = activeQuizQuestions[currentQuestionIndex];
    const answeredCount = Object.keys(userAnswers).length;
    const totalQ = activeQuizQuestions.length;
    const progressPercent = Math.round((answeredCount / totalQ) * 100);

    // Live score calculation in real time
    const liveCorrectCount = Object.entries(userAnswers).filter(
      ([qId, ansIdx]) => {
        const q = activeQuizQuestions.find(item => item.id === qId);
        return q && q.correctAnswer === ansIdx;
      }
    ).length;
    const liveScore = Math.round((liveCorrectCount / (totalQ || 1)) * 10 * 10) / 10;
    const hasAnsweredCurrentQ = currentQ && userAnswers[currentQ.id] !== undefined;
    const isAnswerCorrect = hasAnsweredCurrentQ && userAnswers[currentQ.id] === currentQ.correctAnswer;

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn py-2">
        {/* Exam Navigation & Timer Header */}
        <div className="bg-[#17365D] text-white rounded-2xl p-5 shadow-lg border border-[#245A91] flex flex-wrap items-center justify-between gap-4 sticky top-16 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#F28C28]">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm md:text-base line-clamp-1">{selectedQuiz.title}</h2>
              <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2 mt-0.5">
                <span>Câu {currentQuestionIndex + 1}/{totalQ}</span>
                <span>•</span>
                <span>Đã làm: {answeredCount}/{totalQ}</span>
                <span>•</span>
                <span className="font-bold text-amber-300 font-mono">
                  Điểm trực tiếp: {liveScore}/10 đ ({liveCorrectCount} đúng)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {selectedQuiz.durationMinutes > 0 && (
              <div
                className={`px-3 py-1.5 rounded-xl font-mono text-sm font-bold flex items-center gap-1.5 shadow-inner ${
                  timeLeftSeconds < 120
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                    : 'bg-white/10 text-white'
                }`}
              >
                <Clock className="w-4 h-4 text-[#F28C28]" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}

            <button
              onClick={handleManualSubmit}
              className="px-4 py-2 rounded-xl bg-[#F28C28] hover:bg-[#d9771e] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp bài thi</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-[#245A91] h-2 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Viewport */}
        {currentQ && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-[#17365D]">
                  Câu hỏi số {currentQuestionIndex + 1}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                  {currentQ.difficulty}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Điểm: {currentQ.points || 1} đ</span>
            </div>

            <h3 className="text-base md:text-lg font-bold text-[#17365D] leading-relaxed">
              {currentQ.content}
            </h3>

            {/* Real-Time Right/Wrong Indicator Alert */}
            {hasAnsweredCurrentQ && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between font-bold animate-fadeIn ${
                  isAnswerCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isAnswerCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                  <span>
                    {isAnswerCorrect
                      ? 'CHÍNH XÁC! Bạn được cộng +1 điểm theo thời gian thực.'
                      : `CHƯA CHÍNH XÁC! Đáp án đúng là phương án ${String.fromCharCode(65 + currentQ.correctAnswer)}.`}
                  </span>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-white shadow-xs border border-slate-200">
                  {liveCorrectCount}/{totalQ} câu đúng
                </span>
              </div>
            )}

            {/* Answer Options with Real-Time Right/Wrong Feedback Effects */}
            <div className="space-y-3 pt-1">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = userAnswers[currentQ.id] === optIdx;
                const letter = String.fromCharCode(65 + optIdx);
                const isCorrectOpt = optIdx === currentQ.correctAnswer;
                const isWrongSelected = isSelected && !isCorrectOpt;

                let optionClass = 'bg-white hover:bg-slate-50 border-slate-200';
                let badgeClass = 'bg-slate-100 text-slate-600';

                if (hasAnsweredCurrentQ) {
                  if (isCorrectOpt) {
                    optionClass = 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400/40 shadow-sm';
                    badgeClass = 'bg-emerald-600 text-white shadow-xs';
                  } else if (isWrongSelected) {
                    optionClass = 'bg-red-50/90 border-red-500 ring-2 ring-red-400/40 shadow-sm';
                    badgeClass = 'bg-red-600 text-white shadow-xs';
                  } else {
                    optionClass = 'bg-slate-50/50 border-slate-200 opacity-60';
                  }
                } else if (isSelected) {
                  optionClass = 'bg-blue-50/70 border-[#245A91] ring-2 ring-[#245A91]/20 shadow-xs';
                  badgeClass = 'bg-[#17365D] text-white shadow-xs';
                }

                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectAnswer(currentQ.id, optIdx)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${optionClass}`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {/* Radio button selection indicator */}
                      <div className="pt-1 shrink-0">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? isCorrectOpt
                                ? 'border-emerald-600 bg-emerald-600'
                                : 'border-red-600 bg-red-600'
                              : isCorrectOpt && hasAnsweredCurrentQ
                              ? 'border-emerald-600 bg-emerald-600'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {(isSelected || (hasAnsweredCurrentQ && isCorrectOpt)) && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>

                      <div
                        className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${badgeClass}`}
                      >
                        {letter}
                      </div>
                      <div className="text-xs md:text-sm text-slate-800 pt-0.5 leading-relaxed font-medium">
                        {opt}
                      </div>
                    </div>

                    {hasAnsweredCurrentQ && (
                      <div className="shrink-0 pl-2">
                        {isCorrectOpt && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đúng</span>
                          </span>
                        )}
                        {isWrongSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-lg border border-red-300">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>Sai</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Detailed Explanation on Answer */}
            {hasAnsweredCurrentQ && currentQ.explanation && (
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 text-xs leading-relaxed animate-fadeIn">
                <strong>💡 Giải thích chi tiết: </strong> {currentQ.explanation}
              </div>
            )}

            {/* Navigation buttons: Prev / Next */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Câu trước</span>
              </button>

              {currentQuestionIndex < totalQ - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="px-5 py-2 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>Câu tiếp theo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleManualSubmit}
                  className="px-5 py-2 rounded-xl bg-[#F28C28] hover:bg-[#d9771e] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Hoàn thành & Nộp bài</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Question Palette Grid */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider">
              Bảng câu hỏi ({totalQ} câu)
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-[#245A91]" /> Đã trả lời
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-slate-200" /> Chưa làm
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeQuizQuestions.map((q, idx) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isCurrent = idx === currentQuestionIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'ring-2 ring-[#F28C28] ring-offset-2'
                      : ''
                  } ${
                    isAnswered
                      ? 'bg-[#245A91] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17365D]">Xác nhận nộp bài thi?</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Kiểm tra lại số lượng câu hỏi đã hoàn thành</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Tổng số câu hỏi:</span>
                  <span className="font-bold text-slate-800">{totalQ} câu</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Đã trả lời:</span>
                  <span className="font-bold text-emerald-700">{answeredCount} câu</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Chưa trả lời:</span>
                  <span className={`font-bold ${totalQ - answeredCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                    {totalQ - answeredCount} câu
                  </span>
                </div>
              </div>

              {totalQ - answeredCount > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  Bạn vẫn còn <strong>{totalQ - answeredCount}</strong> câu chưa chọn đáp án. Các câu chưa làm sẽ được tính 0 điểm.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Tiếp tục làm bài
                </button>
                <button
                  type="button"
                  onClick={finishExamSubmission}
                  className="px-5 py-2 bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Xác nhận nộp bài
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= RENDER EXAM RESULT REVIEW SCREEN =================
  if (showResultReview && recentAttempt && selectedQuiz) {
    const questions = QuizService.getQuestionsByQuiz(selectedQuiz.id);
    const allowDetailedReview = selectedQuiz.viewAnswersMode !== 'never';

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn py-4">
        {/* Score Summary Banner */}
        <div className="bg-gradient-to-r from-[#17365D] to-[#245A91] text-white rounded-2xl p-6 md:p-8 shadow-xl border border-[#245A91] text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#F28C28]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Nộp bài thi thành công</span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold font-serif">{selectedQuiz.title}</h2>
          <p className="text-xs text-slate-300">
            Học viên: <strong>{recentAttempt.studentName}</strong> ({recentAttempt.studentId}) • {recentAttempt.studentClass}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            <div className="bg-white/10 px-6 py-4 rounded-2xl backdrop-blur-xs border border-white/10">
              <span className="text-xs text-slate-300 uppercase tracking-wider font-semibold">Điểm số</span>
              <div className="text-3xl md:text-4xl font-extrabold text-[#F28C28] mt-0.5">
                {recentAttempt.score}/10
              </div>
            </div>

            <div className="bg-white/10 px-5 py-4 rounded-2xl backdrop-blur-xs border border-white/10 text-left space-y-1 text-xs">
              <div>Số câu đúng: <strong className="text-emerald-300">{recentAttempt.correctCount}/{questions.length}</strong></div>
              <div>Số câu sai: <strong className="text-red-300">{recentAttempt.wrongCount}</strong></div>
              <div>Chưa làm: <strong className="text-slate-300">{recentAttempt.unansweredCount}</strong></div>
              <div>Thời gian làm: <strong>{formatTime(recentAttempt.durationSeconds)}</strong></div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setShowResultReview(false);
                setRecentAttempt(null);
              }}
              className="px-6 py-2.5 rounded-xl bg-white text-[#17365D] font-bold text-xs shadow-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Quay lại danh sách bài kiểm tra
            </button>
          </div>
        </div>

        {/* Detailed Answer Key Review (When permitted) */}
        {allowDetailedReview && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-[#17365D] font-serif flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#245A91]" />
              <span>CHI TIẾT ĐÁP ÁN VÀ CĂN CỨ GIẢI THÍCH</span>
            </h3>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const selectedAns = recentAttempt.answers[q.id];
                const isCorrect = selectedAns === q.correctAnswer;
                const isUnanswered = selectedAns === undefined || selectedAns === null;

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-2xl p-6 shadow-xs border transition-all ${
                      isCorrect
                        ? 'border-emerald-200'
                        : 'border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#17365D]">Câu {idx + 1}:</span>
                        <span className="text-slate-500">{q.topic}</span>
                      </div>
                      <div>
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đúng (+{q.points || 1} đ)
                          </span>
                        ) : isUnanswered ? (
                          <span className="inline-flex items-center gap-1 font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            <HelpCircle className="w-3.5 h-3.5" /> Chưa trả lời
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                            <XCircle className="w-3.5 h-3.5" /> Sai
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 mb-3">{q.content}</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, optIdx) => {
                        const isChosen = selectedAns === optIdx;
                        const isRightAnswer = q.correctAnswer === optIdx;
                        const letter = String.fromCharCode(65 + optIdx);

                        let badgeStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                        if (isRightAnswer) {
                          badgeStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold ring-1 ring-emerald-300';
                        } else if (isChosen && !isRightAnswer) {
                          badgeStyle = 'bg-red-50 border-red-300 text-red-900 font-bold';
                        }

                        return (
                          <div key={optIdx} className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${badgeStyle}`}>
                            <span className="w-5 h-5 rounded font-bold text-[11px] flex items-center justify-center bg-white/80 shrink-0 border border-slate-300">
                              {letter}
                            </span>
                            <span className="leading-relaxed">{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="mt-4 p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-950 leading-relaxed">
                        <strong className="text-[#17365D]">Căn cứ lý luận & giải thích: </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= MAIN QUIZZES DASHBOARD =================
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[#17365D]" />
            <h1 className="text-xl md:text-2xl font-bold text-[#17365D] font-serif">
              ÔN TẬP TRẮC NGHIỆM SAU BUỔI HỌC
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống bài kiểm tra trắc nghiệm củng cố kiến thức, tự động chấm điểm và đánh giá quá trình
          </p>
        </div>

        {isLecturer ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenQuizEditor()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#F28C28]" />
              <span>Tạo bài kiểm tra mới</span>
            </button>
          </div>
        ) : (
          <button
            onClick={openTeacherModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            title="Dành cho Giảng viên"
          >
            <ShieldCheck className="w-4 h-4 text-[#F28C28]" />
            <span>Giáo viên tạo bài</span>
          </button>
        )}
      </div>

      {/* Quizzes List or Empty State */}
      {quizzes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <CheckSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-700">Chưa có bài kiểm tra trắc nghiệm</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isLecturer
              ? 'Thầy/Cô vui lòng nhấn nút "Tạo bài kiểm tra mới" để tạo bài ôn tập trắc nghiệm.'
              : 'Giảng viên chưa công bố bài kiểm tra trắc nghiệm cho học phần này.'}
          </p>
          {isLecturer ? (
            <button
              onClick={() => handleOpenQuizEditor()}
              className="px-4 py-2 bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer"
            >
              Tạo bài kiểm tra đầu tiên
            </button>
          ) : (
            <button
              onClick={openTeacherModal}
              className="px-4 py-2 bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-[#F28C28]" />
              <span>Đăng nhập Giáo viên để tạo bài trắc nghiệm</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {quizzes.map(quiz => {
          const questions = QuizService.getQuestionsByQuiz(quiz.id);
          const attempts = QuizService.getAttemptsByQuiz(quiz.id);
          const myAttempts = !isLecturer && currentUser
            ? QuizService.getStudentAttempts(quiz.id, currentUser.uid)
            : [];
          const bestScore = myAttempts.length > 0
            ? Math.max(...myAttempts.map(a => a.score))
            : null;

          return (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl p-6 shadow-xs hover:shadow-md border border-slate-200 flex flex-col justify-between transition-all space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#17365D] uppercase">
                    {quiz.chapter}
                  </span>
                  {quiz.isSample && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      DỮ LIỆU MẪU
                    </span>
                  )}
                  {quiz.status === 'draft' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      Bản nháp
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#17365D] leading-snug line-clamp-2">
                  {quiz.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {quiz.instructions}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-[#245A91]" />
                    <span>{questions.length} câu hỏi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#F28C28]" />
                    <span>{quiz.durationMinutes > 0 ? `${quiz.durationMinutes} phút` : 'Tự do'}</span>
                  </div>
                </div>

                {!isLecturer && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <span>
                      Đã làm: <strong>{myAttempts.length}/{quiz.maxAttempts || '∞'}</strong> lần
                    </span>
                    {bestScore !== null && (
                      <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Điểm cao nhất: {bestScore}/10
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {isLecturer ? (
                  <div className="flex items-center justify-between w-full">
                    <button
                      onClick={() => handleOpenQuestionsManager(quiz)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#17365D] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-[#F28C28]" />
                      <span>Quản lý câu hỏi ({questions.length})</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenQuizEditor(quiz)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                        title="Sửa bài thi"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingQuizId(quiz.id)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Xóa bài thi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartExam(quiz)}
                    className="w-full py-2.5 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4 text-[#F28C28]" />
                    <span>{myAttempts.length > 0 ? 'LUYỆN TẬP LẠI' : 'BẮT ĐẦU LUYỆN TẬP'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Question Bank Manager Modal (Lecturer only) */}
      {isQuestionsManagerOpen && questionsManagerQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-[#17365D] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base font-serif">Ngân hàng câu hỏi trắc nghiệm</h3>
                <p className="text-xs text-slate-300 mt-0.5 truncate max-w-md">
                  {questionsManagerQuiz.title} ({managedQuestions.length} câu hỏi)
                </p>
              </div>
              <button
                onClick={() => setIsQuestionsManagerOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            {/* Quick Action Toolbar */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenSingleQuestionEditor()}
                  className="px-3 py-1.5 rounded-lg bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F28C28]" />
                  <span>Thêm câu hỏi lẻ</span>
                </button>

                <button
                  onClick={() => setIsExcelImportOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Nhập hàng loạt từ Excel / CSV</span>
                </button>

                <button
                  onClick={() => setIsAIExtractOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Trích xuất bằng Gemini AI</span>
                </button>
              </div>

              <button
                onClick={downloadQuestionTemplate}
                className="text-xs text-[#245A91] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>TẢI MẪU CÂU HỎI (.xlsx)</span>
              </button>
            </div>

            {/* Questions list */}
            <div className="p-6 overflow-y-auto space-y-3">
              {managedQuestions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                  <CheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold">Bài kiểm tra chưa có câu hỏi nào</p>
                  <p>Thầy/Cô hãy thêm câu hỏi bằng biểu mẫu, nhập từ tệp Excel mẫu hoặc dùng trợ lý Gemini AI.</p>
                </div>
              ) : (
                managedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#17365D]">Câu {idx + 1}.</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                          {q.difficulty}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">{q.topic}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenSingleQuestionEditor(q)}
                          className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                          title="Sửa câu hỏi"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => QuizService.deleteQuestion(q.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="font-semibold text-slate-800 leading-relaxed">{q.content}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-lg text-[11px] flex items-center gap-2 ${
                            optIdx === q.correctAnswer
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold'
                              : 'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span className="w-4 h-4 rounded bg-white flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="truncate">{opt}</span>
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                        Căn cứ: {q.explanation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Excel / CSV Bulk Import Modal */}
      {isExcelImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-[#17365D] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base font-serif">Nhập bộ câu hỏi hàng loạt từ Excel (.xlsx, .csv)</h3>
                <p className="text-xs text-slate-300 mt-0.5">Kiểm tra tính hợp lệ của phương án và đáp án trước khi lưu</p>
              </div>
              <button
                onClick={() => setIsExcelImportOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-blue-50/70 border border-blue-100">
                <div className="space-y-1">
                  <span className="font-bold text-[#17365D] text-xs">Tải mẫu Excel chuẩn:</span>
                  <p className="text-[11px] text-blue-900 leading-relaxed">
                    Mẫu gồm các cột: <strong>Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, Explanation, Points, Topic, Difficulty</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadQuestionTemplate}
                  className="px-3.5 py-1.5 rounded-lg bg-[#17365D] hover:bg-[#245A91] text-white font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#F28C28]" />
                  <span>TẢI MẪU CÂU HỎI</span>
                </button>
              </div>

              {/* Upload Input */}
              <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center space-y-2 bg-slate-50 hover:bg-slate-100 transition-colors">
                <Upload className="w-8 h-8 text-[#245A91] mx-auto" />
                <p className="font-bold text-slate-700">Chọn hoặc kéo thả tệp Excel (.xlsx, .xls hoặc .csv) vào đây</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelFileSelected}
                  className="text-xs text-slate-500 cursor-pointer"
                />
              </div>

              {isImportValidating && (
                <div className="text-center py-4 text-slate-500">
                  Đang phân tích cấu trúc và kiểm tra dữ liệu các dòng...
                </div>
              )}

              {importError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                  {importError}
                </div>
              )}

              {/* Validation Preview Table */}
              {importValidationResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      Xem trước ({importValidationResults.filter(r => r.valid).length} dòng hợp lệ,{' '}
                      <span className="text-red-600 font-bold">
                        {importValidationResults.filter(r => !r.valid).length} dòng lỗi
                      </span>
                      )
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2">Dòng</th>
                          <th className="p-2">Nội dung câu hỏi</th>
                          <th className="p-2">Đáp án</th>
                          <th className="p-2">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importValidationResults.map(r => (
                          <tr key={r.rowNumber} className={r.valid ? 'bg-white' : 'bg-red-50/70'}>
                            <td className="p-2 font-mono">{r.rowNumber}</td>
                            <td className="p-2 max-w-xs truncate font-medium">
                              {r.parsed?.content || r.raw?.Question || 'Trống'}
                            </td>
                            <td className="p-2 font-mono font-bold">
                              {r.valid ? String.fromCharCode(65 + r.parsed!.correctAnswer) : 'Không hợp lệ'}
                            </td>
                            <td className="p-2">
                              {r.valid ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Hợp lệ
                                </span>
                              ) : (
                                <span className="text-red-700 font-bold" title={r.errors.join(', ')}>
                                  {r.errors[0]}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExcelImportOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={importValidationResults.filter(r => r.valid).length === 0}
                  onClick={handleSaveImportedQuestions}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  Lưu các câu hợp lệ vào bài thi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gemini AI Question Extraction Modal */}
      {isAIExtractOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-[#17365D] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F28C28]" />
                <h3 className="font-bold text-base font-serif">
                  Trích xuất câu hỏi từ văn bản bằng Gemini AI
                </h3>
              </div>
              <button
                onClick={() => setIsAIExtractOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 leading-relaxed">
                <strong>Quy trình bảo đảm an toàn: </strong>
                Gemini sẽ trích xuất văn bản thành <em>bản nháp</em>. Những câu hỏi không có đáp án rõ ràng trong đề sẽ được đánh dấu để Giảng viên tự kiểm tra và chọn đáp án đúng trước khi chính thức lưu vào ngân hàng.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dán nội dung đề cương, bài tập hoặc ngân hàng câu hỏi:
                </label>
                <textarea
                  rows={6}
                  value={aiInputText}
                  onChange={e => setAiInputText(e.target.value)}
                  placeholder="Dán nội dung bài thi hoặc câu hỏi dạng:
Câu 1: ...
A. ...
B. ...
C. ...
D. ...
Đáp án: A"
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-mono leading-relaxed"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 italic text-[11px]">{aiNotice}</span>
                <button
                  type="button"
                  disabled={isAiLoading || !aiInputText.trim()}
                  onClick={handleExtractWithAI}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isAiLoading ? 'Đang trích xuất với Gemini...' : 'Bắt đầu trích xuất'}</span>
                </button>
              </div>

              {/* Draft Review for Lecturer */}
              {aiDraftQuestions.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <h4 className="font-bold text-slate-800 text-sm">
                    Bản nháp nhận diện được ({aiDraftQuestions.length} câu) - Vui lòng rà soát:
                  </h4>

                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {aiDraftQuestions.map((draft, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#17365D]">Câu {idx + 1}</span>
                          {draft.needsVerification ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                              Đáp án chưa rõ - Cần giảng viên xác nhận
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Đáp án đã nhận diện
                            </span>
                          )}
                        </div>

                        <input
                          type="text"
                          value={draft.question}
                          onChange={e => {
                            const updated = [...aiDraftQuestions];
                            updated[idx].question = e.target.value;
                            setAiDraftQuestions(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          {draft.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-1.5">
                              <input
                                type="radio"
                                name={`correct-${idx}`}
                                checked={draft.correctAnswer === optIdx}
                                onChange={() => {
                                  const updated = [...aiDraftQuestions];
                                  updated[idx].correctAnswer = optIdx;
                                  updated[idx].needsVerification = false;
                                  setAiDraftQuestions(updated);
                                }}
                                className="cursor-pointer"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={e => {
                                  const updated = [...aiDraftQuestions];
                                  updated[idx].options[optIdx] = e.target.value;
                                  setAiDraftQuestions(updated);
                                }}
                                className="flex-1 px-2 py-1 rounded border border-slate-300 text-[11px] bg-white"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAIExtractOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={aiDraftQuestions.length === 0}
                  onClick={handleSaveAIDraftQuestions}
                  className="px-5 py-2 bg-[#17365D] hover:bg-[#245A91] text-white font-bold rounded-lg disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  Phê duyệt & Lưu vào ngân hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Single Question Editor Modal */}
      {isSingleQuestionEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-[#17365D] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base font-serif">
                {editingSingleQuestion ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
              </h3>
              <button
                onClick={() => setIsSingleQuestionEditorOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSingleQuestion} className="p-6 overflow-y-auto space-y-4 text-xs">
              {sqError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                  {sqError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nội dung câu hỏi <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={sqContent}
                  onChange={e => setSqContent(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi trắc nghiệm..."
                  className="w-full p-3 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Các phương án trả lời & Chọn đáp án đúng <span className="text-red-500">*</span>
                </label>
                {sqOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <label className="flex items-center gap-1 font-bold text-slate-700 cursor-pointer shrink-0">
                      <input
                        type="radio"
                        name="correct-answer-sq"
                        checked={sqCorrectAnswer === idx}
                        onChange={() => setSqCorrectAnswer(idx)}
                      />
                      <span>{String.fromCharCode(65 + idx)}.</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={e => {
                        const updated = [...sqOptions];
                        updated[idx] = e.target.value;
                        setSqOptions(updated);
                      }}
                      placeholder={`Phương án ${String.fromCharCode(65 + idx)}...`}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mức độ nhận thức
                  </label>
                  <select
                    value={sqDifficulty}
                    onChange={e => setSqDifficulty(e.target.value as QuestionDifficulty)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="Nhận biết">Nhận biết</option>
                    <option value="Thông hiểu">Thông hiểu</option>
                    <option value="Vận dụng">Vận dụng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Điểm số
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={sqPoints}
                    onChange={e => setSqPoints(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Căn cứ pháp lý & Giải thích đáp án đúng
                </label>
                <textarea
                  rows={2}
                  value={sqExplanation}
                  onChange={e => setSqExplanation(e.target.value)}
                  placeholder="Ghi rõ điều luật, căn cứ giáo trình để sinh viên tham khảo..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSingleQuestionEditorOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#17365D] hover:bg-[#245A91] text-white font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  Lưu câu hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Details / Configuration Editor Modal */}
      {isQuizEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-[#17365D] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base font-serif">
                {editingQuiz ? 'Chỉnh sửa thông tin bài kiểm tra' : 'Tạo bài kiểm tra trắc nghiệm mới'}
              </h3>
              <button
                onClick={() => setIsQuizEditorOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="p-6 overflow-y-auto space-y-4 text-xs">
              {qfError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                  {qfError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên bài kiểm tra <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={qfTitle}
                  onChange={e => setQfTitle(e.target.value)}
                  placeholder="Ví dụ: Bài trắc nghiệm củng cố Chương 1..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#245A91]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Chương / Bài học
                  </label>
                  <input
                    type="text"
                    value={qfChapter}
                    onChange={e => setQfChapter(e.target.value)}
                    placeholder="Chương 1"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Thời gian làm bài (Phút)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={qfDuration}
                    onChange={e => setQfDuration(parseInt(e.target.value) || 0)}
                    placeholder="15 (0 = không giới hạn)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Hướng dẫn sinh viên làm bài
                </label>
                <textarea
                  rows={2}
                  value={qfInstructions}
                  onChange={e => setQfInstructions(e.target.value)}
                  placeholder="Hướng dẫn cách làm, số lần làm tối đa..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Số lần làm tối đa
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={qfMaxAttempts}
                    onChange={e => setQfMaxAttempts(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hiển thị giải thích đáp án
                  </label>
                  <select
                    value={qfViewAnswers}
                    onChange={e => setQfViewAnswers(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="after_submit">Cho xem ngay sau khi nộp</option>
                    <option value="on_close">Chỉ xem khi đóng bài thi</option>
                    <option value="never">Không công bố đáp án</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Trạng thái công bố
                </label>
                <select
                  value={qfStatus}
                  onChange={e => setQfStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="published">Công bố (Sinh viên có thể làm)</option>
                  <option value="draft">Bản nháp (Chỉ giảng viên xem)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuizEditorOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#17365D] hover:bg-[#245A91] text-white font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  Lưu bài kiểm tra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingQuizId}
        title="Xóa bài kiểm tra trắc nghiệm"
        message="Thầy/Cô có chắc chắn muốn xóa bài kiểm tra này? Tất cả các câu hỏi và lịch sử làm bài của sinh viên cho bài kiểm tra này cũng sẽ bị xóa. Thao tác không thể hoàn tác."
        confirmText="Xóa vĩnh viễn"
        isDanger={true}
        onConfirm={handleDeleteQuiz}
        onCancel={() => setDeletingQuizId(null)}
      />
    </div>
  );
};
