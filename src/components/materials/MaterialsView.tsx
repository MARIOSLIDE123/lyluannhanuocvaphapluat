import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Search,
  Plus,
  Filter,
  FileText,
  Download,
  Eye,
  Trash2,
  Edit,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  FileSpreadsheet,
  FileQuestion,
  Upload,
  Check,
  Tag,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MaterialItem, MaterialCategory, ValidityStatus } from '../../types';
import { MaterialService, subscribe } from '../../services/db';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { ConfirmModal } from '../common/ConfirmModal';

const CATEGORIES: { id: MaterialCategory | 'all'; label: string; count?: number }[] = [
  { id: 'all', label: 'Tất cả học liệu' },
  { id: '01_syllabus', label: '01. Đề cương học phần' },
  { id: '02_textbooks', label: '02. Giáo trình và bài giảng' },
  { id: '03_legal_docs', label: '03. Văn bản quy phạm pháp luật' },
  { id: '04_chapter_materials', label: '04. Học liệu theo chương, bài' },
  { id: '05_references', label: '05. Tài liệu tham khảo' },
  { id: '06_case_studies', label: '06. Tình huống và tài liệu nghiên cứu' },
  { id: '07_supplementary', label: '07. Tài liệu bổ sung' },
];

export const MaterialsView: React.FC = () => {
  const { isLecturer, currentUser, openTeacherModal } = useAuth();
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValidity, setSelectedValidity] = useState<string>('all');
  
  // Modals
  const [viewingMaterial, setViewingMaterial] = useState<MaterialItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<MaterialCategory>('01_syllabus');
  const [formChapter, setFormChapter] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formIssueDate, setFormIssueDate] = useState('');
  const [formEffectiveDate, setFormEffectiveDate] = useState('');
  const [formValidity, setFormValidity] = useState<ValidityStatus>('unverified');
  const [formReplacement, setFormReplacement] = useState('');
  const [formOfficialUrl, setFormOfficialUrl] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formFileSize, setFormFileSize] = useState('');
  const [formFileType, setFormFileType] = useState<'pdf' | 'docx' | 'pptx' | 'xlsx' | 'csv' | 'link'>('pdf');
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');
  const [formError, setFormError] = useState('');

  const loadMaterials = () => {
    const data = isLecturer ? MaterialService.getAll() : MaterialService.getPublished();
    setMaterials(data);
  };

  useEffect(() => {
    loadMaterials();
    const unsub = subscribe('materials', loadMaterials);
    return () => unsub();
  }, [isLecturer]);

  // Open Edit/Create Modal
  const handleOpenEditor = (item?: MaterialItem) => {
    setFormError('');
    if (item) {
      setEditingMaterial(item);
      setFormTitle(item.title);
      setFormDesc(item.description);
      setFormCategory(item.category);
      setFormChapter(item.chapter);
      setFormAuthor(item.authorOrIssuer || '');
      setFormIssueDate(item.issueDate || '');
      setFormEffectiveDate(item.effectiveDate || '');
      setFormValidity(item.validityStatus || 'unverified');
      setFormReplacement(item.replacementNotes || '');
      setFormOfficialUrl(item.officialUrl || '');
      setFormFileName(item.fileName || '');
      setFormFileSize(item.fileSize || '');
      setFormFileType(item.fileType || 'pdf');
      setFormStatus(item.status === 'draft' ? 'draft' : 'published');
    } else {
      setEditingMaterial(null);
      setFormTitle('');
      setFormDesc('');
      setFormCategory(selectedCategory === 'all' ? '01_syllabus' : selectedCategory);
      setFormChapter('Chương 1');
      setFormAuthor('Khoa Luật - Học viện PCCC & CNCH');
      setFormIssueDate(new Date().toISOString().slice(0, 10));
      setFormEffectiveDate('');
      setFormValidity('unverified');
      setFormReplacement('');
      setFormOfficialUrl('');
      setFormFileName('Tai_lieu_hoc_phan_LLNN&PL.pdf');
      setFormFileSize('1.2 MB');
      setFormFileType('pdf');
      setFormStatus('published');
    }
    setIsEditorOpen(true);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Vui lòng nhập tên tài liệu.');
      return;
    }
    if (!formDesc.trim()) {
      setFormError('Vui lòng nhập nội dung mô tả tài liệu.');
      return;
    }

    MaterialService.save({
      id: editingMaterial?.id,
      title: formTitle.trim(),
      description: formDesc.trim(),
      category: formCategory,
      chapter: formChapter.trim() || 'Chương chung',
      authorOrIssuer: formAuthor.trim(),
      issueDate: formIssueDate,
      effectiveDate: formEffectiveDate,
      validityStatus: formValidity,
      replacementNotes: formReplacement.trim(),
      officialUrl: formOfficialUrl.trim(),
      fileName: formFileName.trim() || `${formTitle}.pdf`,
      fileSize: formFileSize || '1.0 MB',
      fileType: formFileType,
      isSample: false, // User created is real data
      status: formStatus,
      uploadedBy: currentUser?.uid || 'lecturer',
      uploadedByName: currentUser?.displayName || 'ThS. Ngô Thị Mai Anh',
    });

    setIsEditorOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      MaterialService.delete(deletingId);
      setDeletingId(null);
    }
  };

  // Filtered List
  const filteredMaterials = materials.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedValidity !== 'all' && item.validityStatus !== selectedValidity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchChapter = item.chapter.toLowerCase().includes(q);
      const matchAuthor = (item.authorOrIssuer || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchChapter && !matchAuthor) return false;
    }
    return true;
  });

  const getValidityBadge = (status: ValidityStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Còn hiệu lực
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3 text-red-600" /> Hết hiệu lực
          </span>
        );
      case 'amended':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Sửa đổi, bổ sung
          </span>
        );
      case 'unverified':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <HelpCircle className="w-3 h-3 text-slate-500" /> Chưa xác minh
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-[#17365D]" />
            <h1 className="text-xl md:text-2xl font-bold text-[#17365D] font-serif">
              KHO HỌC LIỆU HỌC PHẦN
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Thư viện số chuẩn hóa môn Lý luận Nhà nước và Pháp luật • Học viện PCCC & CNCH
          </p>
        </div>

        {isLecturer ? (
          <button
            onClick={() => handleOpenEditor()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-[#F28C28]" />
            <span>Tải lên tài liệu mới</span>
          </button>
        ) : (
          <button
            onClick={openTeacherModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            title="Dành cho Giảng viên"
          >
            <ShieldCheck className="w-4 h-4 text-[#F28C28]" />
            <span>Giảng viên tải lên</span>
          </button>
        )}
      </div>

      {/* Main Grid: Sidebar folders & Materials list */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Folders categories navigation */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">
              Danh mục học liệu ({CATEGORIES.length - 1} nhóm)
            </h3>
            <div className="space-y-1">
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat.id;
                const catCount =
                  cat.id === 'all'
                    ? materials.length
                    : materials.filter(m => m.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#17365D] text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate pr-2">{cat.label}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full shrink-0 font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {catCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-100 text-xs text-blue-900 leading-relaxed">
            <div className="font-bold text-[#17365D] mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>Lưu ý về văn bản pháp luật</span>
            </div>
            Đối với văn bản quy phạm pháp luật, học viên cần đối chiếu tình trạng hiệu lực và các văn bản sửa đổi, bổ sung đã được ghi chú trước khi trích dẫn vào bài làm.
          </div>
        </div>

        {/* Right: Materials search, filter and list */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên tài liệu, cơ quan ban hành, chương..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#245A91] focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Hiệu lực:</span>
              <select
                value={selectedValidity}
                onChange={e => setSelectedValidity(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#245A91] cursor-pointer"
              >
                <option value="all">Tất cả hiệu lực</option>
                <option value="active">Còn hiệu lực</option>
                <option value="amended">Được sửa đổi, bổ sung</option>
                <option value="expired">Hết hiệu lực</option>
                <option value="unverified">Chưa xác minh</option>
              </select>
            </div>
          </div>

          {/* List of Material Items */}
          {filteredMaterials.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <FileQuestion className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-700">
                {materials.length === 0 ? 'Giảng viên chưa tải tài liệu lên' : 'Không tìm thấy tài liệu phù hợp'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {materials.length === 0
                  ? 'Hiện tại chưa có tài liệu nào trong hệ thống. Giảng viên vui lòng tải lên tài liệu mới.'
                  : 'Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục học liệu khác.'}
              </p>
              {materials.length === 0 && (
                isLecturer ? (
                  <button
                    onClick={() => handleOpenEditor()}
                    className="px-4 py-2 bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer"
                  >
                    Tải lên tài liệu đầu tiên
                  </button>
                ) : (
                  <button
                    onClick={openTeacherModal}
                    className="px-4 py-2 bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#F28C28]" />
                    <span>Đăng nhập Giáo viên để tải tài liệu lên</span>
                  </button>
                )
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMaterials.map(mat => (
                <div
                  key={mat.id}
                  className="bg-white rounded-2xl p-5 shadow-xs hover:shadow-md border border-slate-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#17365D] uppercase">
                        {mat.chapter}
                      </span>
                      {getValidityBadge(mat.validityStatus)}
                      {mat.isSample && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          DỮ LIỆU MẪU – CHƯA PHẢI NỘI DUNG CHÍNH THỨC
                        </span>
                      )}
                      {mat.status === 'draft' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                          Bản nháp
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => setViewingMaterial(mat)}
                      className="text-sm md:text-base font-bold text-[#17365D] hover:text-[#245A91] cursor-pointer transition-colors leading-snug"
                    >
                      {mat.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {mat.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-slate-400 pt-1">
                      {mat.authorOrIssuer && (
                        <span>Cơ quan: <strong className="text-slate-600">{mat.authorOrIssuer}</strong></span>
                      )}
                      {mat.fileName && (
                        <span>Tệp: <strong className="text-slate-600">{mat.fileName}</strong> ({mat.fileSize || 'PDF'})</span>
                      )}
                      <span>Cập nhật: {new Date(mat.uploadedAt).toLocaleDateString('vi-VN')}</span>
                    </div>

                    {mat.replacementNotes && (
                      <p className="text-[11px] text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-md border border-amber-200">
                        <strong>Ghi chú văn bản:</strong> {mat.replacementNotes}
                      </p>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <button
                      onClick={() => setViewingMaterial(mat)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#17365D] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem đọc</span>
                    </button>

                    <button
                      onClick={() => setViewingMaterial(mat)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors cursor-pointer"
                      title="Tải tệp"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {isLecturer && (
                      <>
                        <button
                          onClick={() => handleOpenEditor(mat)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors cursor-pointer"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(mat.id)}
                          className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs transition-colors cursor-pointer"
                          title="Xóa tài liệu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal for Lecturer */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-[#17365D] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base font-serif">
                {editingMaterial ? 'Chỉnh sửa tài liệu học liệu' : 'Tải lên tài liệu học liệu mới'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên tài liệu / Văn bản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Giáo trình Lý luận Nhà nước và Pháp luật (Tập 1)"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#245A91]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nhóm học liệu <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as MaterialCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#245A91] bg-white"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Chương / Chuyên đề
                  </label>
                  <input
                    type="text"
                    value={formChapter}
                    onChange={e => setFormChapter(e.target.value)}
                    placeholder="Ví dụ: Chương 1: Nguồn gốc Nhà nước"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#245A91]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mô tả nội dung & yêu cầu học tập <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Tóm tắt nội dung chính và các yêu cầu sinh viên cần lưu ý..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#245A91]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cơ quan ban hành / Tác giả
                  </label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={e => setFormAuthor(e.target.value)}
                    placeholder="Quốc hội, Bộ Công an..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ngày ban hành
                  </label>
                  <input
                    type="date"
                    value={formIssueDate}
                    onChange={e => setFormIssueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tình trạng hiệu lực
                  </label>
                  <select
                    value={formValidity}
                    onChange={e => setFormValidity(e.target.value as ValidityStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                  >
                    <option value="unverified">Chưa xác minh</option>
                    <option value="active">Còn hiệu lực</option>
                    <option value="amended">Được sửa đổi, bổ sung</option>
                    <option value="expired">Hết hiệu lực</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ghi chú sửa đổi, bổ sung hoặc thay thế (nếu có)
                </label>
                <input
                  type="text"
                  value={formReplacement}
                  onChange={e => setFormReplacement(e.target.value)}
                  placeholder="Ví dụ: Được sửa đổi bởi Luật số 63/2020/QH14 ngày 18/06/2020"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tên tệp đính kèm
                  </label>
                  <input
                    type="text"
                    value={formFileName}
                    onChange={e => setFormFileName(e.target.value)}
                    placeholder="Giao_trinh_LLNN&PL_Tap1.pdf"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Dung lượng hiển thị
                  </label>
                  <input
                    type="text"
                    value={formFileSize}
                    onChange={e => setFormFileSize(e.target.value)}
                    placeholder="2.4 MB"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Đường dẫn nguồn chính thức
                  </label>
                  <input
                    type="url"
                    value={formOfficialUrl}
                    onChange={e => setFormOfficialUrl(e.target.value)}
                    placeholder="https://thuvienphapluat.vn/..."
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Trạng thái công bố
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                  >
                    <option value="published">Công bố (Sinh viên xem được)</option>
                    <option value="draft">Bản nháp (Chỉ giảng viên)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Lưu tài liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewer Modal */}
      <DocumentViewerModal
        material={viewingMaterial}
        onClose={() => setViewingMaterial(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingId}
        title="Xóa tài liệu học liệu"
        message="Thầy/Cô có chắc chắn muốn xóa tài liệu này khỏi kho học liệu không? Thao tác này không thể hoàn tác."
        confirmText="Xóa vĩnh viễn"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
