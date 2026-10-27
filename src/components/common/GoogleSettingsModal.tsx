import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Link,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  ExternalLink,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GoogleSyncService } from '../../services/googleSync';

export const GoogleSettingsModal: React.FC = () => {
  const { isGoogleSettingsModalOpen, closeGoogleSettingsModal } = useAuth();

  const [url, setUrl] = useState('');
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isGoogleSettingsModalOpen) {
      setUrl(GoogleSyncService.getScriptUrl());
      setTestResult(null);
    }
  }, [isGoogleSettingsModalOpen]);

  if (!isGoogleSettingsModalOpen) return null;

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    GoogleSyncService.setScriptUrl(url);

    if (!url.trim()) {
      setTestResult({
        success: true,
        message: 'Đã lưu cấu hình (chế độ lưu trữ cục bộ).',
      });
      setIsTesting(false);
      return;
    }

    const res = await GoogleSyncService.testConnection(url.trim());
    setTestResult(res);
    setIsTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#17365D] via-[#1c4373] to-[#245A91] text-white p-6 relative">
          <button
            onClick={closeGoogleSettingsModal}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-[#F28C28] shadow-inner shrink-0 border border-white/20">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-amber-200 font-bold flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-[#F28C28]" />
                <span>Google Cloud Integration</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Cấu hình kết nối Google Sheet & Google Drive
              </h3>
              <p className="text-xs text-slate-200 mt-0.5">
                Đồng bộ thông tin học viên, điểm số và lưu trữ học liệu theo thời gian thực
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSaveAndTest} className="p-6 space-y-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 leading-relaxed space-y-1.5">
            <div className="font-bold text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Tính năng tự động đồng bộ thời gian thực:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-emerald-800">
              <li>Lưu tức thì thông tin học sinh (Họ tên, MSV, Lớp, Trường) vào tab <strong>HocVien</strong>.</li>
              <li>Ghi nhận điểm thi, số câu đúng/sai, thời gian làm bài trắc nghiệm vào tab <strong>KetQuaKiemTra</strong>.</li>
              <li>Tự động đẩy tài liệu giáo viên tải lên vào thư mục Google Drive chuyên biệt.</li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              URL ứng dụng Web Google Apps Script (Web App URL)
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#245A91] font-mono"
              />
              <Link className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Dán URL Web App triển khai từ tệp mã nguồn <code>GoogleAppsScript_Code.js</code> trong thư mục dự án.
            </p>
          </div>

          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{testResult.message}</span>
            </div>
          )}

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="font-bold text-[#17365D]">3 Bước triển khai nhanh trên Google Apps Script:</div>
            <ol className="list-decimal pl-5 space-y-1 text-slate-600">
              <li>Mở Google Trang tính mới &gt; <strong>Tiện ích mở rộng</strong> &gt; <strong>Apps Script</strong>.</li>
              <li>Dán nội dung từ tệp <strong><code>GoogleAppsScript_Code.js</code></strong> có sẵn trong thư mục dự án.</li>
              <li>Bấm <strong>Triển khai (Deploy)</strong> &gt; <strong>Tùy chọn triển khai mới (New deployment)</strong> &gt; Loại: <strong>Ứng dụng web (Web App)</strong> &gt; Quyền truy cập: <strong>Bất kỳ ai (Anyone)</strong>.</li>
            </ol>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={closeGoogleSettingsModal}
              className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isTesting}
              className="py-2.5 px-5 bg-[#17365D] hover:bg-[#245A91] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#F28C28]" />
              <span>{isTesting ? 'Đang kiểm tra kết nối...' : 'Lưu & Kiểm tra kết nối'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
