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
  ShieldCheck,
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-200">
                <p>
                  Giảng viên phụ trách: <span className="text-[#F28C28] font-bold">ThS. Ngô Thị Mai Anh</span>
                </p>
                <p>
                  Thời lượng: <span className="font-semibold text-amber-200">42 tiết (2 tín chỉ)</span>
                </p>
                <p>
                  Đối tượng: <span className="font-semibold text-emerald-300">Học viên Hệ Đại học chính quy Công an</span>
                </p>
                <p>
                  Địa chỉ liên hệ: <span className="text-slate-300">243 Khuất Duy Tiến, Đại Mỗ, Hà Nội</span>
                </p>
                <p className="sm:col-span-2 text-slate-300 flex flex-wrap items-center gap-3 pt-0.5">
                  <span>Email: <strong className="text-white">maianhtq@gmail.com</strong></span>
                  <span>•</span>
                  <span>SĐT: <strong className="text-white">0973292966</strong></span>
                </p>
              </div>
            </div>

            <p className="text-slate-200 text-xs md:text-sm leading-relaxed max-w-4xl pt-2 border-t border-white/10">
              Không gian học tập chuẩn hóa dành cho học viên học phần Lý luận Nhà nước và Pháp luật. Cung cấp kho học liệu chính thống, Nhiệm vụ tự nghiên cứu của học viên và bài tập củng cố kiến thức!
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
                <span className="truncate">Học phần: Lý luận nhà nước và pháp luật (42 tiết - 2 tín chỉ)</span>
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
        <div className="xl:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-[#17365D]" />
              <h3 className="font-bold text-base text-[#17365D] uppercase tracking-wide">
                4. MỤC TIÊU HỌC PHẦN
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#17365D] border border-blue-200">
              Đề cương chi tiết học phần
            </span>
          </div>

          <div className="space-y-4">
            {/* 4.1. Về kiến thức */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#17365D]">
                <GraduationCap className="w-4 h-4 text-[#F28C28]" />
                <h4>4.1. Về kiến thức</h4>
              </div>
              <p className="text-xs text-slate-500 italic">Học phần này nhằm:</p>
              <ul className="space-y-2 text-xs text-slate-700 leading-relaxed list-disc pl-5">
                <li>
                  Trang bị cho sinh viên những kiến thức cơ bản về nguồn gốc, bản chất, chức năng, hình thức, kiểu, vai trò của nhà nước và pháp luật; bộ máy nhà nước; mối quan hệ giữa nhà nước, pháp luật với các hiện tượng xã hội khác; quá trình vận động và phát triển của nhà nước và pháp luật; quy phạm pháp luật; quan hệ pháp luật; thực hiện pháp luật; ý thức pháp luật; vi phạm pháp luật và trách nhiệm pháp lí; ngành luật Hiến pháp.
                </li>
                <li>
                  Xây dựng cho sinh viên cách tư duy khoa học và phương pháp nhận thức khoa học về những vấn đề nhà nước và pháp luật; giúp sinh viên vận dụng những kiến thức đã học để phân tích và giải thích hiện tượng nhà nước và pháp luật trong thực tế.
                </li>
              </ul>
            </div>

            {/* 4.2. Về kỹ năng */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#17365D]">
                <Award className="w-4 h-4 text-[#245A91]" />
                <h4>4.2. Về kỹ năng</h4>
              </div>
              <p className="text-xs text-slate-500 italic">Học phần này nhằm làm hình thành ở sinh viên:</p>
              <ul className="space-y-2 text-xs text-slate-700 leading-relaxed list-disc pl-5">
                <li>
                  Khả năng vận dụng những kiến thức đã học vào nghiên cứu các học phần thuộc khối kiến thức cơ sở và kiến thức ngành trong chương trình đào tạo.
                </li>
                <li>
                  Khả năng vận dụng các kiến thức đã học vào giải quyết các vấn đề của thực tiễn nhà nước và pháp luật;
                </li>
                <li>
                  Năng lực thu thập thông tin, kĩ năng tổng hợp, hệ thống hoá các vấn đề trong mối quan hệ tổng thể; kĩ năng so sánh, phân tích, bình luận, đánh giá các vấn đề của lí luận nhà nước pháp luật;
                </li>
              </ul>
            </div>

            {/* 4.3. Về năng lực tự chủ và trách nhiệm */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#17365D]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4>4.3. Về năng lực tự chủ và trách nhiệm</h4>
              </div>
              <p className="text-xs text-slate-500 italic">Học phần này nhằm:</p>
              <ul className="space-y-2 text-xs text-slate-700 leading-relaxed list-disc pl-5">
                <li>
                  Xây dựng năng lực nhìn nhận, đánh giá khách quan các hiện tượng chính trị, pháp lí trong đời sống xã hội cho học viên;
                </li>
                <li>
                  Hình thành tính chủ động, tự tin, bản lĩnh cho học viên;
                </li>
                <li>
                  Hình thành ở học viên kĩ năng sống có trách nhiệm và thái độ thượng tôn pháp luật.
                </li>
              </ul>
            </div>
          </div>

          {/* DANH MỤC HỌC LIỆU Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#F28C28]" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#17365D]">
                  DANH MỤC HỌC LIỆU
                </h4>
              </div>
              <button
                onClick={() => onNavigate('materials')}
                className="text-xs text-[#245A91] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Mở Kho học liệu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1 text-xs font-semibold">
              <div
                onClick={() => onNavigate('materials')}
                className="p-3 rounded-lg bg-white border border-blue-100 shadow-2xs text-[#17365D] hover:border-[#245A91] hover:shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="w-6 h-6 rounded-full bg-[#17365D] text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span className="leading-tight">Đề cương chi tiết học phần</span>
              </div>
              <div
                onClick={() => onNavigate('materials')}
                className="p-3 rounded-lg bg-white border border-blue-100 shadow-2xs text-[#17365D] hover:border-[#245A91] hover:shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="w-6 h-6 rounded-full bg-[#17365D] text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span className="leading-tight">Tài liệu chính</span>
              </div>
              <div
                onClick={() => onNavigate('materials')}
                className="p-3 rounded-lg bg-white border border-blue-100 shadow-2xs text-[#17365D] hover:border-[#245A91] hover:shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="w-6 h-6 rounded-full bg-[#17365D] text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span className="leading-tight">Tài liệu tham khảo</span>
              </div>
              <div
                onClick={() => onNavigate('materials')}
                className="p-3 rounded-lg bg-white border border-blue-100 shadow-2xs text-[#17365D] hover:border-[#245A91] hover:shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="w-6 h-6 rounded-full bg-[#17365D] text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
                <span className="leading-tight">Hệ thống câu hỏi thảo luận</span>
              </div>
              <div
                onClick={() => onNavigate('materials')}
                className="p-3 rounded-lg bg-white border border-blue-100 shadow-2xs text-[#17365D] hover:border-[#245A91] hover:shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="w-6 h-6 rounded-full bg-[#17365D] text-white flex items-center justify-center text-xs font-bold shrink-0">5</span>
                <span className="leading-tight">Hệ thống bài tập tình huống</span>
              </div>
            </div>
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
