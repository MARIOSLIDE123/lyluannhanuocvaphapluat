import React, { useState } from 'react';
import { X, Download, ExternalLink, FileText, CheckCircle2, AlertCircle, Clock, ZoomIn, ZoomOut, Info } from 'lucide-react';
import { MaterialItem, ValidityStatus } from '../../types';

interface DocumentViewerModalProps {
  material: MaterialItem | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ material, onClose }) => {
  const [zoom, setZoom] = useState<number>(100);

  if (!material) return null;

  const getValidityBadge = (status: ValidityStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Còn hiệu lực
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5" /> Hết hiệu lực
          </span>
        );
      case 'amended':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Được sửa đổi, bổ sung
          </span>
        );
      case 'unverified':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5" /> Chưa xác minh hiệu lực
          </span>
        );
    }
  };

  const handleDownload = () => {
    // If Google Drive link is available, download/open directly
    if (material.officialUrl && material.officialUrl.startsWith('http')) {
      window.open(material.officialUrl, '_blank');
      return;
    }

    // If file data (base64) is stored
    if (material.fileData && material.fileData.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = material.fileData;
      a.download = material.fileName || `${material.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Fallback document text export
    const content = `TÀI LIỆU HỌC PHẦN: LÝ LUẬN NHÀ NƯỚC VÀ PHÁP LUẬT
HỌC VIỆN PHÒNG CHÁY CHỮA CHÁY VÀ CỨU NẠN CỨU HỘ - KHOA LUẬT
Giảng viên: Ngô Thị Mai Anh

Tên tài liệu: ${material.title}
Chương/Phần: ${material.chapter}
Cơ quan ban hành / Tác giả: ${material.authorOrIssuer || 'Khoa Luật - Học viện PCCC & CNCH'}
Ngày ban hành: ${material.issueDate || 'Chưa cập nhật'} | Ngày hiệu lực: ${material.effectiveDate || 'Chưa cập nhật'}
Tình trạng hiệu lực: ${material.validityStatus}
${material.replacementNotes ? `Ghi chú thay thế/sửa đổi: ${material.replacementNotes}` : ''}
${material.officialUrl ? `Nguồn chính thức: ${material.officialUrl}` : ''}

NỘI DUNG MÔ TẢ & HỌC LIỆU:
${material.description}

(Tệp tin được xuất tự động từ Hệ thống học tập trực tuyến Học viện PCCC & CNCH)`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = material.fileName || `${material.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 md:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Top Header */}
        <div className="bg-[#17365D] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#F28C28]" />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-base md:text-lg font-bold truncate leading-tight">
                {material.title}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 truncate">
                {material.chapter} • Tệp: {material.fileName || 'Tài liệu học tập'} ({material.fileSize || 'Chuẩn PDF'})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#F28C28] hover:bg-[#d9771e] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải xuống</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metadata info strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="font-semibold text-slate-700">Hiệu lực pháp lý: </span>
              {getValidityBadge(material.validityStatus)}
            </div>
            {material.authorOrIssuer && (
              <div>
                <span className="font-semibold text-slate-700">Cơ quan ban hành: </span>
                <span className="text-slate-800">{material.authorOrIssuer}</span>
              </div>
            )}
            {material.issueDate && (
              <div>
                <span className="font-semibold text-slate-700">Ngày ban hành: </span>
                <span>{material.issueDate}</span>
              </div>
            )}
            {material.effectiveDate && (
              <div>
                <span className="font-semibold text-slate-700">Ngày hiệu lực: </span>
                <span>{material.effectiveDate}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {material.officialUrl && (
              <a
                href={material.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#245A91] hover:underline font-medium"
              >
                <span>Nguồn chính thức</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md px-1.5 py-0.5">
              <button
                onClick={() => setZoom(Math.max(70, zoom - 15))}
                className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-[11px] font-mono text-slate-600">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(150, zoom + 15))}
                className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Replacement / Legal Notes notice if applicable */}
        {material.replacementNotes && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-start gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Ghi chú sửa đổi, bổ sung hoặc thay thế: </span>
              <span>{material.replacementNotes}</span>
            </div>
          </div>
        )}

        {/* Document Content Viewport */}
        <div className="flex-1 bg-slate-200 p-4 md:p-8 overflow-y-auto flex justify-center">
          <div
            style={{ width: `${zoom}%`, maxWidth: '900px' }}
            className="bg-white shadow-xl rounded-xl p-8 md:p-12 min-h-full transition-all duration-150 border border-slate-300 font-serif leading-relaxed text-slate-800"
          >
            <div className="text-center border-b border-slate-300 pb-6 mb-8 font-sans">
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                Học viện Phòng cháy chữa cháy và Cứu nạn cứu hộ
              </p>
              <p className="text-xs uppercase font-bold text-[#17365D]">Khoa Luật - Bộ môn Lý luận Nhà nước & Pháp luật</p>
              <div className="w-20 h-0.5 bg-[#F28C28] mx-auto my-3" />
              <h1 className="text-xl md:text-2xl font-bold text-[#17365D] uppercase mt-2 font-serif">
                {material.title}
              </h1>
              <p className="text-xs text-slate-500 mt-1 italic font-sans">
                Giảng viên phụ trách: ThS. Ngô Thị Mai Anh
              </p>
            </div>

            <div className="prose max-w-none text-slate-700 text-sm md:text-base space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 font-sans text-xs mb-6 not-italic">
                <span className="font-bold text-slate-800">Tóm tắt nội dung học tập: </span>
                {material.description}
              </div>

              <h2 className="text-base font-bold text-[#17365D] font-sans border-b border-slate-200 pb-1 pt-2">
                1. MỤC ĐÍCH VÀ YÊU CẦU NGHIÊN CỨU
              </h2>
              <p>
                Tài liệu phục vụ công tác giảng dạy và học tập học phần <strong>Lý luận Nhà nước và Pháp luật</strong> dành cho học viên, sinh viên hệ Đại học Học viện PCCC & CNCH.
                Yêu cầu người học tự đọc kỹ nội dung, đối chiếu với đề cương học phần và làm rõ các mối liên hệ thực tiễn trong công tác bảo đảm trật tự an toàn phòng cháy, chữa cháy và cứu nạn, cứu hộ.
              </p>

              <h2 className="text-base font-bold text-[#17365D] font-sans border-b border-slate-200 pb-1 pt-4">
                2. NỘI DUNG TRỌNG TÂM
              </h2>
              <p>
                - Nắm vững hệ thống khái niệm, phạm trù, quy luật cơ bản về nguồn gốc, bản chất, chức năng, hình thức và bộ máy của Nhà nước, trọng tâm là Nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam.
              </p>
              <p>
                - Hiểu rõ bản chất, nguồn, quy phạm pháp luật, quan hệ pháp luật, thực hiện pháp luật, vi phạm pháp luật và trách nhiệm pháp lý.
              </p>
              <p>
                - Vận dụng kiến thức lý luận để nhận thức đúng đắn đường lối, chính sách của Đảng và pháp luật của Nhà nước trong lĩnh vực quản lý nhà nước về an ninh trật tự, PCCC và CNCH.
              </p>

              <h2 className="text-base font-bold text-[#17365D] font-sans border-b border-slate-200 pb-1 pt-4">
                3. TÀI LIỆU VÀ CĂN CỨ THAM KHẢO
              </h2>
              <ul className="list-disc pl-5 space-y-1 font-sans text-xs text-slate-600">
                <li>Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam năm 2013.</li>
                <li>Luật Ban hành văn bản quy phạm pháp luật năm 2015 (sửa đổi, bổ sung năm 2020).</li>
                <li>Giáo trình Lý luận Nhà nước và Pháp luật - Học viện Phòng cháy chữa cháy và Cứu nạn cứu hộ.</li>
              </ul>
            </div>

            <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 font-sans">
              <span>Học phần: Lý luận Nhà nước và Pháp luật</span>
              <span>Trang 1 / 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
