import React from 'react';
import { BookOpen, MapPin, Mail, Phone, ShieldCheck, GraduationCap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#17365D] text-white border-t border-[#245A91] mt-16 text-xs">
      <div className="w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#F28C28]">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm font-serif">LÝ LUẬN NHÀ NƯỚC VÀ PHÁP LUẬT</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Hệ thống quản lý học tập trực tuyến học phần Lý luận nhà nước và pháp luật dành cho học viên Hệ Đại học chính quy Công an, phục vụ nghiên cứu học liệu số, nhiệm vụ tự nghiên cứu và ôn tập trắc nghiệm củng cố kiến thức.
            </p>
            <div className="mt-4 flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-[#F28C28]" />
              <span className="font-semibold text-white">Khoa Luật • Học viện PCCC & CNCH</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-[#F28C28] mb-3">
              Thông tin học phần & Giảng viên
            </h4>
            <ul className="space-y-2 text-slate-300 text-xs">
              <li>
                <strong className="text-white">Giảng viên phụ trách:</strong> ThS. Ngô Thị Mai Anh
              </li>
              <li>
                <strong className="text-white">Học phần:</strong> Lý luận nhà nước và pháp luật
              </li>
              <li>
                <strong className="text-white">Thời lượng:</strong> 42 tiết (2 tín chỉ)
              </li>
              <li>
                <strong className="text-white">Đối tượng:</strong> Học viên Hệ Đại học chính quy Công an
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-[#F28C28] mb-3">
              Địa chỉ liên hệ
            </h4>
            <div className="space-y-2.5 text-slate-300 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>243 Khuất Duy Tiến, Đại Mỗ, Hà Nội</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>maianhtq@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>0973292966</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© 2024 - 2025 Khoa Luật - Học viện Phòng cháy chữa cháy và Cứu nạn cứu hộ. Bảo lưu mọi quyền.</p>
          <p className="italic">Theory of State and Law • Academic E-Learning Portal</p>
        </div>
      </div>
    </footer>
  );
};
