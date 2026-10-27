import React from 'react';
import {
  FolderOpen,
  FileEdit,
  CheckSquare,
  BarChart3,
  Bell,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Award,
  Sparkles,
  ChevronRight,
  Lock,
  Building2,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MaterialService, AssignmentService, QuizService, AnnouncementService } from '../../services/db';
import { ActiveTab } from '../layout/Navbar';

interface HomeViewProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const {
    studentProfile,
    isLecturer,
    openTeacherModal,
    openStudentModal,
    openStudentHistoryModal,
  } = useAuth();

  const materials = MaterialService.getPublished();
  const assignments = AssignmentService.getPublished();
  const quizzes = QuizService.getPublishedQuizzes();
  const announcements = AnnouncementService.getAll();

  const handleCardClick = (id: string) => {
    if (id === 'analytics') {
      if (!isLecturer) {
        openTeacherModal();
        return;
      }
    }
    onNavigate(id as ActiveTab);
  };

  const cards = [
    {
      id: 'materials',
      title: 'KHO HỌC LIỆU',
      subtitle: 'Tài liệu, giáo trình, văn bản quy phạm pháp luật và tình huống nghiên cứu',
      count: `${materials.length} tài liệu`,
      icon: FolderOpen,
      color: 'from-[#17365D] to-[#245A91]',
      badgeColor: 'bg-blue-100 text-[#17365D]',
      requiresTeacher: false,
    },
    {
      id: 'assignments',
      title: 'TỰ NGHIÊN CỨU',
      subtitle: 'Nhiệm vụ chuẩn bị bài, câu hỏi định hướng và nộp bài làm trực tuyến',
      count: `${assignments.length} nhiệm vụ`,
      icon: FileEdit,
      color: 'from-[#245A91] to-[#1e6091]',
      badgeColor: 'bg-amber-100 text-amber-900',
      requiresTeacher: false,
    },
    {
      id: 'quizzes',
      title: 'ÔN TẬP TRẮC NGHIỆM',
      subtitle: 'Bài kiểm tra trắc nghiệm củng cố kiến thức sau buổi học, tự động chấm điểm',
      count: `${quizzes.length} bài trắc nghiệm`,
      icon: CheckSquare,
      color: 'from-[#17365D] to-[#2a4d7d]',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      requiresTeacher: false,
    },
    {
      id: 'analytics',
      title: 'THỐNG KÊ KẾT QUẢ',
      subtitle: isLecturer
        ? 'Theo dõi tiến độ, phân tích câu hỏi và xuất bảng điểm học phần'
        : 'Bảng điểm & Thống kê toàn diện (Chỉ dành cho Giáo viên)',
      count: isLecturer ? 'Quản trị kết quả' : 'Dành cho Giáo viên',
      icon: BarChart3,
      color: 'from-[#245A91] to-[#3170b0]',
      badgeColor: isLecturer ? 'bg-indigo-100 text-indigo-900' : 'bg-amber-100 text-amber-900',
      requiresTeacher: !isLecturer,
    },
    {
      id: 'announcements',
      title: 'THÔNG BÁO HỌC PHẦN',
      subtitle: 'Lịch học, nhiệm vụ mới, lưu ý kiểm tra và tài liệu từ giảng viên',
      count: `${announcements.length} thông báo`,
      icon: Bell,
      color: 'from-[#17365D] to-[#20436d]',
      badgeColor: 'bg-purple-100 text-purple-900',
      requiresTeacher: false,
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn w-full">
      {/* Hero Header Section - Widescreen 16:9 responsive layout */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#17365D] via-[#1c4373] to-[#245A91] text-white p-6 md:p-10 shadow-xl border border-[#245A91]">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Academic intro */}
          <div className="xl:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-amber-200 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>Hệ thống học tập tương tác trực tuyến</span>
            </div>

            <div>
              <p className="text-xs md:text-sm font-semibold tracking-wider uppercase text-slate-300">
                HỌC VIỆN PHÒNG CHÁY CHỮA CHÁY VÀ CỨU NẠN CỨU HỘ • KHOA LUẬT
              </p>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight font-serif mt-1 text-white uppercase leading-snug">
                LÝ LUẬN NHÀ NƯỚC VÀ PHÁP LUẬT
              </h1>
              <p className="text-sm md:text-base text-slate-300 mt-2 font-medium">
                Giảng viên phụ trách: <span className="text-[#F28C28] font-bold">ThS. Ngô Thị Mai Anh</span>
              </p>
            </div>

            <p className="text-slate-200 text-xs md:text-sm leading-relaxed max-w-4xl pt-2 border-t border-white/10">
              Không gian học tập chuẩn hóa dành cho học viên học phần Lý luận Nhà nước và Pháp luật.
              Cung cấp kho học liệu chính thống, nhiệm vụ tự nghiên cứu trước giờ lên lớp và bài ôn tập trắc nghiệm củng cố kiến thức.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('materials')}
                className="px-5 py-2.5 rounded-xl bg-[#F28C28] hover:bg-[#d9771e] text-white font-bold text-xs md:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Khám phá Kho học liệu</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <button
                onClick={() => onNavigate('assignments')}
                className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs md:text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileEdit className="w-4 h-4" />
                <span>Nhiệm vụ tự nghiên cứu</span>
              </button>
              <button
                onClick={() => onNavigate('quizzes')}
                className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs md:text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Ôn tập trắc nghiệm</span>
              </button>
            </div>
          </div>

          {/* Right Column: Active Student Identification Card */}
          <div className="xl:col-span-4 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 space-y-4">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-200 uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-[#F28C28]" />
                <span>Thông tin học viên</span>
              </div>
              {!isLecturer && (
                <button
                  onClick={openStudentModal}
                  className="text-[11px] text-slate-200 hover:text-white flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                  title="Thay đổi thông tin học viên"
                >
                  <Edit3 className="w-3 h-3 text-[#F28C28]" />
                  <span>Sửa thông tin</span>
                </button>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start justify-between">
                <span className="text-slate-300">Họ và tên:</span>
                <span className="font-bold text-white text-right">
                  {studentProfile?.displayName || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-300">Mã sinh viên:</span>
                <span className="font-mono font-bold text-amber-300 text-right">
                  {studentProfile?.studentId || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-300">Lớp sinh hoạt:</span>
                <span className="font-bold text-emerald-300 text-right">
                  {studentProfile?.studentClass || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex items-start justify-between pt-1 border-t border-white/10">
                <span className="text-slate-300">Trường:</span>
                <span className="font-medium text-slate-100 text-right text-[11px] max-w-[200px]">
                  {studentProfile?.school || 'Học viện PCCC & CNCH'}
                </span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <div className="text-[11px] text-slate-300 bg-white/5 rounded-xl p-2.5 border border-white/10 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-[#F28C28] shrink-0" />
                <span className="truncate">Học phần: Lý luận Nhà nước và Pháp luật (3 TC)</span>
              </div>
              <button
                onClick={openStudentHistoryModal}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Xem Điểm & Lịch sử học tập</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Functional Navigation Cards (Spanning 16:9 Widescreen) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#17365D] tracking-tight font-serif">
              CÁC PHÂN HỆ HỌC TẬP CHÍNH
            </h2>
            <p className="text-xs text-slate-500">
              Chọn phân hệ để truy cập tài liệu, bài tập tự nghiên cứu và ôn luyện
            </p>
          </div>
          {isLecturer && (
            <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-[#F28C28]/15 text-[#F28C28] border border-[#F28C28]/30">
              Quyền Giáo viên: ThS. Ngô Thị Mai Anh
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
          {cards.map((c, index) => {
            const Icon = c.icon;
            return (
              <div
                key={c.id}
                onClick={() => handleCardClick(c.id)}
                className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl border border-slate-200/80 hover:border-[#245A91] transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-5 h-5 text-[#F28C28]" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badgeColor} flex items-center gap-1`}>
                      {c.requiresTeacher && <Lock className="w-2.5 h-2.5" />}
                      <span>{c.count}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#17365D] group-hover:text-[#245A91] transition-colors leading-snug flex items-center gap-1">
                    <span>{index + 1}. {c.title}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {c.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#245A91] group-hover:text-[#F28C28] transition-colors">
                  <span>{c.requiresTeacher ? 'Đăng nhập xem' : 'Truy cập'}</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Syllabus & Academic Guide Overview (Widescreen 16:9 layout) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <BookOpen className="w-5 h-5 text-[#17365D]" />
            <h3 className="font-bold text-base text-[#17365D]">
              MỤC TIÊU VÀ YÊU CẦU ĐÀO TẠO HỌC PHẦN
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                <GraduationCap className="w-4 h-4 text-[#245A91]" />
                Chuẩn đầu ra kiến thức
              </span>
              <p className="leading-relaxed">
                Nắm vững hệ thống phạm trù, quy luật cơ bản về nguồn gốc, bản chất, bộ máy nhà nước và bản chất, hình thức, quy phạm pháp luật, vi phạm pháp luật và pháp chế XHCN.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                <Award className="w-4 h-4 text-[#F28C28]" />
                Vận dụng thực tiễn PCCC & CNCH
              </span>
              <p className="leading-relaxed">
                Vận dụng quan điểm, đường lối của Đảng và quy định pháp luật vào công tác quản lý nhà nước về phòng cháy, chữa cháy và cứu nạn, cứu hộ trong toàn quốc.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 leading-relaxed">
            <strong className="text-blue-950">Quy trình học tập tương tác: </strong>
            (1) Tải và nghiên cứu tài liệu trong <strong>Kho học liệu</strong>;
            (2) Thực hiện câu hỏi chuẩn bị trong mục <strong>Tự nghiên cứu trước giờ học</strong>;
            (3) Thảo luận trực tiếp trên giảng đường cùng giảng viên;
            (4) Hoàn thành <strong>Ôn tập trắc nghiệm</strong> để củng cố kiến thức và ghi nhận điểm số.
          </div>
        </div>

        <div className="xl:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#F28C28]" />
                <h3 className="font-bold text-sm text-[#17365D]">THÔNG BÁO MỚI NHẤT</h3>
              </div>
              <button
                onClick={() => onNavigate('announcements')}
                className="text-xs text-[#245A91] hover:underline font-semibold cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="space-y-3">
              {announcements.slice(0, 3).map(ann => (
                <div
                  key={ann.id}
                  onClick={() => onNavigate('announcements')}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#17365D]">
                      {ann.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(ann.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{ann.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-center">
            <button
              onClick={() => onNavigate('announcements')}
              className="text-xs text-[#245A91] hover:text-[#17365D] font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Xem toàn bộ thông báo từ Giảng viên</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
