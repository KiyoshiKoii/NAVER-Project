/* filepath: /d:/Personal/NAVER/web-track-naver-vietnam-ai-hackathon-KiyoshiKoii/src/components/ConfirmModal.tsx */
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    const styles = {
      danger: {
        icon: '🗑️',
        confirmBtn: 'bg-red-500 hover:bg-red-600 focus:ring-red-500/50',
        iconBg: 'bg-red-500/20 text-red-400'
      },
      warning: {
        icon: '⚠️',
        confirmBtn: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/50',
        iconBg: 'bg-amber-500/20 text-amber-400'
      },
      info: {
        icon: 'ℹ️',
        confirmBtn: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500/50',
        iconBg: 'bg-blue-500/20 text-blue-400'
      }
    };
    return styles[type];
  };

  const style = getTypeStyles();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-800/95 rounded-2xl border border-slate-700/50 backdrop-blur-xl shadow-2xl transform transition-all duration-200 scale-100">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${style.iconBg}`}>
              <span className="text-xl">{style.icon}</span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                {title}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {message}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 ${style.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;