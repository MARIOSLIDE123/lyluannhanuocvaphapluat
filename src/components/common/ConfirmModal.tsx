import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                isDanger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#17365D]">{title}</h3>
              <p className="text-sm text-slate-500 mt-0.5">Xác nhận thao tác hệ thống</p>
            </div>
          </div>
          <p className="text-slate-600 text-sm mt-4 leading-relaxed whitespace-pre-line">{message}</p>
        </div>
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors cursor-pointer ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#17365D] hover:bg-[#245A91]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
