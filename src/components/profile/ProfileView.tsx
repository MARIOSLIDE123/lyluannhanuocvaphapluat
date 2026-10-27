import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  GraduationCap,
  Building2,
  Lock,
  Database,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Key,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  clearAllSampleData,
  restoreDefaultSampleData,
  exportFullDatabase,
  importFullDatabase,
  UserService,
} from '../../services/db';
import { ConfirmModal } from '../common/ConfirmModal';

export const ProfileView: React.FC = () => {
  const { currentUser, isLecturer, systemConfig, updateProfile, initializeFirstLecturer } = useAuth();

  // Profile Edit Form
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [studentId, setStudentId] = useState(currentUser?.studentId || '');
  const [studentClass, setStudentClass] = useState(currentUser?.studentClass || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [updateMsg, setUpdateMsg] = useState('');

  // Initial Master Lecturer Setup form (if unlocked)
  const [initLecturerName, setInitLecturerName] = useState(systemConfig.lecturerName);
  const [initLecturerEmail, setInitLecturerEmail] = useState(systemConfig.lecturerEmail);
  const [initFaculty, setInitFaculty] = useState(systemConfig.facultyName);
  const [initError, setInitError] = useState('');
  const [initSuccess, setInitSuccess] = useState('');

  // Confirmation modals
  const [showClearSampleConfirm, setShowClearSampleConfirm] = useState(false);
  const [showRestoreSampleConfirm, setShowRestoreSampleConfirm] = useState(false);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      displayName: displayName.trim(),
      studentId: studentId.trim().toUpperCase(),
      studentClass: studentClass.trim().toUpperCase(),
      email: email.trim(),
    });
    setUpdateMsg('Đã cập nhật thông tin cá nhân thành công!');
    setTimeout(() => setUpdateMsg(''), 3000);
  };

  const handleInitializeLecturer = (e: React.FormEvent) => {
    e.preventDefault();
    setInitError('');
    try {
      initializeFirstLecturer({
        fullName: initLecturerName.trim(),
        email: initLecturerEmail.trim(),
        faculty: initFaculty.trim(),
      });
      setInitSuccess('Khởi tạo tài khoản giảng viên quản trị thành công! Hệ thống đã khóa bảo mật.');
    } catch (err: any) {
      setInitError(err.message || 'Lỗi thiết lập giảng viên');
    }
  };

  const handleExportBackup = () => {
    const data = exportFullDatabase();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sao_luu_He_thong_LLNN&PL_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const ok = importFullDatabase(parsed);
        if (ok) {
          alert('Đã khôi phục dữ liệu từ tệp sao lưu thành công!');
        } else {
          alert('Tệp sao lưu không đúng định dạng.');
        }
      } catch (err) {
        alert('Lỗi đọc tệp JSON sao lưu.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#17365D] font-serif">
            HỒ SƠ CÁ NHÂN & CẤU HÌNH HỆ THỐNG
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý thông tin tài khoản, phân quyền giảng viên và bảo lưu dữ liệu học phần
          </p>
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
            isLecturer ? 'bg-[#F28C28]' : 'bg-[#245A91]'
          }`}
        >
          {isLecturer ? <ShieldCheck className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-[#17365D] uppercase tracking-wide flex items-center gap-2">
            <User className="w-4 h-4 text-[#245A91]" />
            <span>Thông tin tài khoản cá nhân</span>
          </h3>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              isLecturer ? 'bg-[#F28C28] text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isLecturer ? 'Vai trò: Giảng viên phụ trách' : 'Vai trò: Sinh viên hệ Đại học'}
          </span>
        </div>

        {updateMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{updateMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Họ và tên hiển thị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#245A91]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Địa chỉ Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#245A91]"
              />
            </div>
          </div>

          {!isLecturer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mã sinh viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#245A91]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lớp sinh hoạt <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentClass}
                  onChange={e => setStudentClass(e.target.value)}
                  placeholder="D30-PCCC"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-[#245A91]"
                />
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-between">
            <span>Học phần đăng ký: <strong>Lý luận Nhà nước và Pháp luật</strong> (3 tín chỉ)</span>
            <span className="text-[11px] font-mono text-slate-400">UID: {currentUser?.uid}</span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              Lưu thay đổi hồ sơ
            </button>
          </div>
        </form>
      </div>

      {/* Lecturer Master Account Initialization Status */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#F28C28]" />
            <h3 className="font-bold text-sm text-[#17365D] uppercase tracking-wide">
              Xác lập tài khoản Giảng viên đầu tiên & Khóa bảo mật
            </h3>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              systemConfig.adminLock
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {systemConfig.adminLock ? 'Đã khóa bảo mật RBAC' : 'Chưa khóa'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 leading-relaxed">
          <p>
            <strong>Cơ chế phân quyền tin cậy: </strong>
            Theo yêu cầu an toàn, hệ thống không cho phép người dùng trên trình duyệt tự gán quyền Giảng viên.
            Tài khoản Giảng viên chính thức đã được ấn định cho <strong>{systemConfig.lecturerName}</strong> ({systemConfig.lecturerEmail}) – Khoa Luật, Học viện Phòng cháy chữa cháy và Cứu nạn cứu hộ.
          </p>
        </div>

        {initError && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
            {initError}
          </div>
        )}
        {initSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
            {initSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500">Giảng viên:</span>
            <div className="font-bold text-slate-800 mt-0.5">{systemConfig.lecturerName}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500">Email giảng viên:</span>
            <div className="font-bold text-slate-800 mt-0.5 font-mono">{systemConfig.lecturerEmail}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500">Khoa / Đơn vị:</span>
            <div className="font-bold text-slate-800 mt-0.5">{systemConfig.facultyName}</div>
          </div>
        </div>
      </div>

      {/* Database Management & Clean State (Lecturer Only) */}
      {isLecturer && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Database className="w-4 h-4 text-[#245A91]" />
            <h3 className="font-bold text-sm text-[#17365D] uppercase tracking-wide">
              Quản trị dữ liệu học phần & Xử lý dữ liệu mẫu
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <strong>Nguyên tắc dữ liệu mẫu: </strong>
            Tất cả các tài liệu, nhiệm vụ và bài trắc nghiệm có nhãn <em>DỮ LIỆU MẪU – CHƯA PHẢI NỘI DUNG CHÍNH THỨC</em> chỉ phục vụ mục đích kiểm thử và duyệt trước. Thầy/Cô có thể xóa sạch để bắt đầu tải học liệu chính thức, hoặc khôi phục lại khi cần trình diễn.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <button
              onClick={() => setShowClearSampleConfirm(true)}
              className="p-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa sạch dữ liệu mẫu</span>
            </button>

            <button
              onClick={() => setShowRestoreSampleConfirm(true)}
              className="p-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#17365D] font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi phục dữ liệu mẫu chuẩn</span>
            </button>

            <button
              onClick={handleExportBackup}
              className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Tải file sao lưu (.json)</span>
            </button>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <label className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 cursor-pointer flex items-center gap-2 transition-colors">
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Khôi phục từ tệp JSON đã sao lưu</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-slate-400">
              Đồng bộ tự động với lưu trữ cục bộ và tệp sao lưu máy chủ
            </span>
          </div>
        </div>
      )}

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={showClearSampleConfirm}
        title="Xác nhận xóa dữ liệu mẫu"
        message="Thầy/Cô có muốn xóa toàn bộ các tài liệu, nhiệm vụ và bài trắc nghiệm có nhãn dữ liệu mẫu không? Kho học liệu sẽ ở trạng thái sẵn sàng để Thầy/Cô đăng tải học liệu chính thức."
        confirmText="Xóa dữ liệu mẫu"
        isDanger={true}
        onConfirm={() => {
          clearAllSampleData();
          setShowClearSampleConfirm(false);
          alert('Đã xóa sạch toàn bộ dữ liệu mẫu!');
        }}
        onCancel={() => setShowClearSampleConfirm(false)}
      />

      <ConfirmModal
        isOpen={showRestoreSampleConfirm}
        title="Khôi phục dữ liệu mẫu chuẩn"
        message="Hệ thống sẽ nạp lại bộ tài liệu, nhiệm vụ tự nghiên cứu và ngân hàng câu hỏi trắc nghiệm mẫu cho môn Lý luận Nhà nước và Pháp luật."
        confirmText="Khôi phục"
        onConfirm={() => {
          restoreDefaultSampleData();
          setShowRestoreSampleConfirm(false);
          alert('Đã khôi phục dữ liệu mẫu chuẩn thành công!');
        }}
        onCancel={() => setShowRestoreSampleConfirm(false)}
      />
    </div>
  );
};
