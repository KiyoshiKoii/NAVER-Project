/* filepath: /d:/Personal/NAVER/web-track-naver-vietnam-ai-hackathon-KiyoshiKoii/src/components/Toast.tsx */
import React from 'react';
import type { Toast } from '../hooks/useToast';

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const getToastStyles = (type: Toast['type']) => {
    const styles = {
      success: {
        bg: 'bg-emerald-500/20 border-emerald-500/30',
        icon: '✅',
        iconBg: 'bg-emerald-500',
        text: 'text-emerald-300',
      },
      error: {
        bg: 'bg-red-500/20 border-red-500/30',
        icon: '❌',
        iconBg: 'bg-red-500',
        text: 'text-red-300',
      },
      warning: {
        bg: 'bg-amber-500/20 border-amber-500/30',
        icon: '⚠️',
        iconBg: 'bg-amber-500',
        text: 'text-amber-300',
      },
      info: {
        bg: 'bg-blue-500/20 border-blue-500/30',
        icon: 'ℹ️',
        iconBg: 'bg-blue-500',
        text: 'text-blue-300',
      },
    };
    return styles[type];
  };

  const style = getToastStyles(toast.type);

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm
        ${style.bg} ${style.text}
        transform transition-all duration-300 ease-out
        animate-slide-in-right shadow-lg
      `}
    >
      <div className={`flex-shrink-0 w-8 h-8 ${style.iconBg} rounded-full flex items-center justify-center text-white text-sm`}>
        {style.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-white text-sm">{toast.title}</h4>
        {toast.message && (
          <p className="text-xs mt-1 opacity-90">{toast.message}</p>
        )}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-slate-400 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
      >
        <span className="text-xs">✕</span>
      </button>
    </div>
  );
};

export default ToastComponent;