import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, X, KeyRound, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Xác thực tài khoản Giáo viên',
  description = 'Phần Thống kê kết quả và Quản trị học phần chỉ dành riêng cho Giáo viên bộ môn.',
}) => {
  const { loginTeacher } = useAuth();
  const [username, setUsername] = useState('ngothimaianh');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Vui lòng nhập tên tài khoản giáo viên.');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    const success = loginTeacher(username, password);
    if (success) {
      setPassword('');
      setError('');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError('Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#17365D] via-[#1c4373] to-[#245A91] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-[#F28C28] shadow-inner shrink-0 border border-white/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-amber-200 font-bold flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-[#F28C28]" />
                <span>Khu vực bảo mật</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">{title}</h3>
              <p className="text-xs text-slate-200 mt-0.5">Giảng viên: ThS. Ngô Thị Mai Anh</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 leading-relaxed">
            {description}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-medium">{error}</span>
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
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ngothimaianh"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A91] focus:border-transparent font-medium"
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
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu (2026)"
                className="w-full pl-9 pr-12 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A91] focus:border-transparent font-medium"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-[#17365D] hover:bg-[#245A91] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-lg"
            >
              <ShieldCheck className="w-4 h-4 text-[#F28C28]" />
              <span>Đăng nhập Giáo viên</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
