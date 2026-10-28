import React, { useState, useEffect } from 'react';
import { GraduationCap, Building2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const StudentGateModal: React.FC = () => {
  const { studentProfile, hasStudentProfile, saveStudentProfile, isStudentModalOpen, closeStudentModal } = useAuth();

  const isOpen = !hasStudentProfile || isStudentModalOpen;

  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [school, setSchool] = useState('Học viện Phòng cháy chữa cháy và Cứu nạn cứu hộ');
  const [error, setError] = useState('');

  useEffect(() => {
    if (studentProfile) {
      setFullName(studentProfile.displayName || '');
      setStudentId(studentProfile.studentId || '');
      setStudentClass(studentProfile.studentClass || '');
      setSchool(studentProfile.school || 'Học viện Phòng cháy chữa cháy và Cứu nạn cứu hộ');
    } else {
      setFullName('');
      setStudentId('');
      setStudentClass('');
      setSchool('Học viện Phòng cháy chữa cháy và Cứu nạn cứu hộ');
    }
    setError('');
  }, [studentProfile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nameVal = fullName.trim();
    const idVal = studentId.trim();
    const classVal = studentClass.trim();
    const schoolVal = school.trim();

    if (!nameVal) {
      setError('Họ và tên là bắt buộc. Vui lòng nhập đầy đủ.');
      return;
    }
    if (!idVal) {
      setError('Mã số sinh viên là bắt buộc. Vui lòng nhập đầy đủ.');
      return;
    }
    if (!classVal) {
      setError('Lớp học là bắt buộc. Vui lòng nhập đầy đủ.');
      return;
    }
    if (!schoolVal) {
      setError('Trường là bắt buộc. Vui lòng nhập đầy đủ.');
      return;
    }

    saveStudentProfile({
      fullName: nameVal,
      studentId: idVal,
      studentClass: classVal,
      school: schoolVal,
    });
  };

  const isMandatory = !hasStudentProfile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#17365D] to-[#245A91] text-white p-6 relative">
          {!isMandatory && (
            <button
              onClick={closeStudentModal}
              className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-[#F28C28] shadow-inner shrink-0 border border-white/20">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-amber-200 font-bold">
                HỌC VIỆN PCCC & CNCH • KHOA LUẬT
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {isMandatory ? 'Thông tin học viên bắt buộc' : 'Cập nhật thông tin học viên'}
              </h3>
              <p className="text-xs text-slate-200 mt-0.5">
                Học phần: Lý luận nhà nước và pháp luật (42 tiết - 2 tín chỉ)
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-[#F28C28] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              {isMandatory ? (
                <>
                  Học viên vui lòng điền đầy đủ <strong>4 thông tin bắt buộc</strong> dưới đây để hệ thống tự động ghi nhận kết quả tự nghiên cứu và ôn tập trắc nghiệm.
                </>
              ) : (
                <>
                  Bạn có thể cập nhật thông tin cá nhân. Thông tin mới sẽ áp dụng cho các bài nộp và lượt ôn tập tiếp theo.
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* 1. Họ và tên */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A91] focus:border-transparent font-medium"
            />
          </div>

          {/* 2 & 3. Mã số SV & Lớp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Mã số sinh viên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                placeholder="Ví dụ: SV202401"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A91] focus:border-transparent uppercase font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                3. Lớp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={studentClass}
                onChange={e => setStudentClass(e.target.value)}
                placeholder="Ví dụ: D30-PCCC"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A91] focus:border-transparent uppercase font-semibold"
              />
            </div>
          </div>

          {/* 4. Trường */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              4. Trường <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={school}
              onChange={e => setSchool(e.target.value)}
              placeholder="Ví dụ: Học viện Phòng cháy chữa cháy và Cứu nạn cứu hộ"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#245A91] focus:border-transparent font-medium"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center gap-3">
            {!isMandatory && (
              <button
                type="button"
                onClick={closeStudentModal}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-[#17365D] hover:bg-[#245A91] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4 text-[#F28C28]" />
              <span>{isMandatory ? 'Xác nhận và vào học tập' : 'Lưu thông tin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
