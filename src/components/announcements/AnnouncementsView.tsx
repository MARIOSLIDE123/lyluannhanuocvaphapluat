import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Pin,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
  Edit,
  Tag,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AnnouncementItem } from '../../types';
import { AnnouncementService, subscribe } from '../../services/db';
import { ConfirmModal } from '../common/ConfirmModal';

export const AnnouncementsView: React.FC = () => {
  const { isLecturer, currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<AnnouncementItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<AnnouncementItem['category']>('Chung');
  const [formPriority, setFormPriority] = useState<AnnouncementItem['priority']>('normal');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formError, setFormError] = useState('');

  const loadAnnouncements = () => {
    setAnnouncements(AnnouncementService.getAll());
  };

  useEffect(() => {
    loadAnnouncements();
    const unsub = subscribe('announcements', loadAnnouncements);
    return () => unsub();
  }, []);

  const handleOpenEditor = (ann?: AnnouncementItem) => {
    setFormError('');
    if (ann) {
      setEditingAnn(ann);
      setFormTitle(ann.title);
      setFormContent(ann.content);
      setFormCategory(ann.category);
      setFormPriority(ann.priority);
      setFormIsPinned(ann.isPinned);
    } else {
      setEditingAnn(null);
      setFormTitle('');
      setFormContent('');
      setFormCategory('Chung');
      setFormPriority('normal');
      setFormIsPinned(false);
    }
    setIsEditorOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Vui lòng nhập tiêu đề thông báo.');
      return;
    }
    if (!formContent.trim()) {
      setFormError('Vui lòng nhập nội dung thông báo.');
      return;
    }

    AnnouncementService.save({
      id: editingAnn?.id,
      title: formTitle.trim(),
      content: formContent.trim(),
      category: formCategory,
      priority: formPriority,
      isPinned: formIsPinned,
      targetClasses: ['Tất cả'],
      createdByName: currentUser?.displayName || 'ThS. Ngô Thị Mai Anh - Khoa Luật',
    });

    setIsEditorOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      AnnouncementService.delete(deletingId);
      setDeletingId(null);
    }
  };

  const filtered = announcements.filter(a => {
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
    }
    return true;
  });

  // Sort pinned first, then newest
  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#17365D]" />
            <h1 className="text-xl md:text-2xl font-bold text-[#17365D] font-serif">
              THÔNG BÁO TỪ GIẢNG VIÊN VÀ KHOA LUẬT
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cập nhật lịch học, nhiệm vụ học tập, lưu ý kiểm tra và tài liệu mới học phần
          </p>
        </div>

        {isLecturer && (
          <button
            onClick={() => handleOpenEditor()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#17365D] hover:bg-[#245A91] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-[#F28C28]" />
            <span>Đăng thông báo mới</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc nội dung thông báo..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#245A91]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Chủ đề:</span>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#245A91] cursor-pointer"
          >
            <option value="all">Tất cả chủ đề</option>
            <option value="Lịch học">Lịch học</option>
            <option value="Nhiệm vụ mới">Nhiệm vụ mới</option>
            <option value="Lưu ý kiểm tra">Lưu ý kiểm tra</option>
            <option value="Tài liệu mới">Tài liệu mới</option>
            <option value="Chung">Chung</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {sorted.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 text-xs">
            Không có thông báo nào phù hợp.
          </div>
        ) : (
          sorted.map(ann => (
            <div
              key={ann.id}
              className={`bg-white rounded-2xl p-6 shadow-xs border transition-all space-y-3 ${
                ann.isPinned ? 'border-[#245A91] bg-blue-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {ann.isPinned && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#17365D] text-white">
                      <Pin className="w-3 h-3 text-[#F28C28]" /> Đã ghim
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#17365D]">
                    {ann.category}
                  </span>
                  {ann.priority === 'urgent' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                      Khẩn
                    </span>
                  )}
                  {ann.priority === 'important' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Quan trọng
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(ann.createdAt).toLocaleString('vi-VN')}</span>
                  {isLecturer && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleOpenEditor(ann)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                        title="Sửa"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(ann.id)}
                        className="p-1 hover:bg-red-50 rounded text-red-600 cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold text-[#17365D] leading-snug">{ann.title}</h3>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{ann.content}</p>

              <div className="pt-2 text-[11px] text-slate-400 font-medium">
                Người đăng: <strong className="text-slate-600">{ann.createdByName}</strong>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal for Lecturer */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-[#17365D] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base font-serif">
                {editingAnn ? 'Chỉnh sửa thông báo' : 'Đăng thông báo mới'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tiêu đề thông báo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Kế hoạch kiểm tra trắc nghiệm giữa kỳ..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#245A91]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Chủ đề thông báo
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="Chung">Chung</option>
                    <option value="Lịch học">Lịch học</option>
                    <option value="Nhiệm vụ mới">Nhiệm vụ mới</option>
                    <option value="Lưu ý kiểm tra">Lưu ý kiểm tra</option>
                    <option value="Tài liệu mới">Tài liệu mới</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mức độ ưu tiên
                  </label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="normal">Bình thường</option>
                    <option value="important">Quan trọng</option>
                    <option value="urgent">Khẩn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nội dung chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  placeholder="Nội dung truyền đạt tới sinh viên các lớp..."
                  className="w-full p-3 rounded-lg border border-slate-300 text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pin-ann"
                  checked={formIsPinned}
                  onChange={e => setFormIsPinned(e.target.checked)}
                  className="cursor-pointer"
                />
                <label htmlFor="pin-ann" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Ghim thông báo này lên đầu trang
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#17365D] hover:bg-[#245A91] text-white font-bold rounded-lg cursor-pointer"
                >
                  Đăng thông báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deletingId}
        title="Xóa thông báo"
        message="Thầy/Cô có chắc chắn muốn xóa thông báo này? Thao tác không thể hoàn tác."
        confirmText="Xóa vĩnh viễn"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
