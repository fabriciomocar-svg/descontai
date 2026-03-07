import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 4000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-white border-emerald-100',
    error: 'bg-white border-rose-100',
    warning: 'bg-white border-amber-100',
    info: 'bg-white border-blue-100'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`flex items-center gap-3 p-4 rounded-2xl shadow-lg border ${bgColors[type]} min-w-[300px] max-w-md pointer-events-auto backdrop-blur-sm`}
    >
      <div className="shrink-0">{icons[type]}</div>
      <p className="text-sm font-medium text-gray-700 flex-1">{message}</p>
      <button 
        onClick={() => onClose(id)}
        className="shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};

export default Toast;
