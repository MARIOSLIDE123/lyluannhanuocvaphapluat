import React from 'react';
import {
  BookOpen,
  FolderOpen,
  FileEdit,
  CheckSquare,
  BarChart3,
  Bell,
  ShieldCheck,
  Layers,
  GraduationCap,
  Lock,
  LogOut,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type ActiveTab =
  | 'home'
  | 'materials'
  | 'assignments'
  | 'quizzes'
  | 'analytics'
  | 'announcements';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unreadAnnouncementsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  unreadAnnouncementsCount = 0,
}) => {
  const {
    studentProfile,
    isLecturer,
    exitTeacherMode,
    openTeacherModal,
    openStudentModal,
  } = useAuth();

  const handleNavClick = (tabId: ActiveTab) => {
    if (tabId === 'analytics' && !isLecturer) {
      openTeacherModal();
      return;
    }
    setActiveTab(tabId);
  };

  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: Layers },
    { id: 'materials', label: 'Kho học liệu', icon: FolderOpen },
    { id: 'assignments', label: 'Tự nghiên cứu', icon: FileEdit },
    { id: 'quizzes', label: 'Ôn tập trắc nghiệm', icon: CheckSquare },
    {
      id: 'analytics',
      label: 'Thống kê kết quả',
      icon: BarChart3,
      isRestricted: !isLecturer,
    },
    { id: 'announcements', label: 'Thông báo', icon: Bell, badge: unreadAnnouncementsCount },
  ];

  return (
    <header className="bg-[#17365D] text-white sticky top-0 z-40 shadow-lg border-b border-[#245A91]">
      {/* Top Academic Banner (Full 16:9 Widescreen) */}
      <div className="bg-[#0f2440] border-b border-white/10 px-4 sm:px-6 lg:px-8 xl:px-10 py-1.5 text-xs">
        <div className="w-full max-w-[1850px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F28C28] animate-pulse" />
            <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] sm:text-xs">
              Học viện Phòng cháy chữa cháy và Cứu nạn cứu hộ • Khoa Luật
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-300">
            <span>
              Giảng viên phụ trách:{' '}
              <strong className="text-white">ThS. Ngô Thị Mai Anh</strong>
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline font-mono text-[#F28C28]">
              Học kỳ I • Năm học 2024 - 2025
            </span>
          </div>
        </div>
      </div>

      {/* Main Bar (Full 16:9 Widescreen) */}
      <div className="w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#245A91] to-[#17365D] border border-white/20 flex items-center justify-center text-[#F28C28] shadow-md group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm md:text-base font-extrabold tracking-tight leading-tight text-white uppercase font-serif">
              LÝ LUẬN NHÀ NƯỚC VÀ PHÁP LUẬT
            </div>
            <div className="text-[10px] text-slate-300 uppercase tracking-wider font-medium">
              Theory of State and Law • PCCC & CNCH
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as ActiveTab)}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#245A91] text-white shadow-xs font-bold border border-white/20'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#F28C28]' : 'text-slate-300'}`} />
                <span>{item.label}</span>
                {item.isRestricted && (
                  <span className="p-0.5 rounded bg-amber-400/20 text-amber-300 ml-0.5" title="Chỉ Giáo viên mới truy cập được">
                    <Lock className="w-3 h-3" />
                  </span>
                )}
                {item.badge && item.badge > 0 ? (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-[#F28C28] text-white font-bold leading-none">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* User Identity Section */}
        <div className="flex items-center gap-3">
          {isLecturer ? (
            /* TEACHER MODE ACTIVE */
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-xs text-amber-200 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-[#F28C28]" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-300">Quyền Giáo viên</div>
                  <div className="font-bold text-white text-xs leading-tight">ThS. Ngô Thị Mai Anh</div>
                </div>
              </div>
              <button
                onClick={() => {
                  exitTeacherMode();
                  setActiveTab('home');
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/20 hover:border-red-400/40 border border-white/20 text-xs font-semibold text-slate-200 hover:text-red-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Quay lại giao diện học viên"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Về giao diện Học viên</span>
              </button>
            </div>
          ) : (
            /* STUDENT MODE ACTIVE */
            <div className="flex items-center gap-2">
              <div
                onClick={openStudentModal}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs cursor-pointer transition-colors group"
                title="Nhấn để xem hoặc sửa thông tin học viên"
              >
                <div className="w-7 h-7 rounded-lg bg-[#245A91] flex items-center justify-center text-white shrink-0 group-hover:bg-[#F28C28] transition-colors">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white leading-tight flex items-center gap-1.5">
                    <span className="truncate max-w-[140px]">
                      {studentProfile?.displayName || 'Học viên'}
                    </span>
                    {studentProfile?.studentClass && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                        {studentProfile.studentClass}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-300 truncate max-w-[180px] font-mono">
                    MSV: {studentProfile?.studentId || 'Chưa cập nhật'}
                  </div>
                </div>
                <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-amber-300 ml-1 transition-colors" />
              </div>

              {/* Discreet Teacher Login Button */}
              <button
                onClick={openTeacherModal}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Đăng nhập tài khoản Giáo viên để xem Thống kê & Quản trị"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#F28C28]" />
                <span className="hidden xl:inline">Giáo viên</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="lg:hidden bg-[#1f426d] px-3 py-2 overflow-x-auto flex items-center gap-1 border-t border-white/10">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id as ActiveTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-white text-[#17365D] font-bold shadow-xs'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.isRestricted && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
            </button>
          );
        })}
      </div>
    </header>
  );
};
