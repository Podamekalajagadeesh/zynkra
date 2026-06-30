import { useToast } from '../hooks/useToast';
import { Toast } from '../contexts/ToastContext';
import { X, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const toastConfig = {
  success: {
    bgColor: 'bg-emerald-50/95 dark:bg-emerald-950/35',
    borderColor: 'border-emerald-200 dark:border-emerald-900/50',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    titleColor: 'text-emerald-800 dark:text-emerald-200',
    icon: <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-300" />,
  },
  error: {
    bgColor: 'bg-red-50/95 dark:bg-red-950/35',
    borderColor: 'border-red-200 dark:border-red-900/50',
    textColor: 'text-red-900 dark:text-red-100',
    titleColor: 'text-red-800 dark:text-red-200',
    icon: <AlertCircle size={20} className="text-red-600 dark:text-red-300" />,
  },
  warning: {
    bgColor: 'bg-amber-50/95 dark:bg-amber-950/35',
    borderColor: 'border-amber-200 dark:border-amber-900/50',
    textColor: 'text-amber-900 dark:text-amber-100',
    titleColor: 'text-amber-800 dark:text-amber-200',
    icon: <AlertTriangle size={20} className="text-amber-600 dark:text-amber-300" />,
  },
  info: {
    bgColor: 'bg-sky-50/95 dark:bg-sky-950/35',
    borderColor: 'border-sky-200 dark:border-sky-900/50',
    textColor: 'text-sky-900 dark:text-sky-100',
    titleColor: 'text-sky-800 dark:text-sky-200',
    icon: <Info size={20} className="text-sky-600 dark:text-sky-300" />,
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();
  const config = toastConfig[toast.type];

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} ${config.textColor} surface-soft border p-4 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.5)] flex items-start gap-3 animate-slide-in`}
      role="alert"
      aria-live="polite"
    >
      {config.icon}
      <div className="flex-1">
        <p className="text-sm font-medium leading-5">{toast.message}</p>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="ml-2 rounded-full p-1 text-current opacity-70 transition-opacity hover:opacity-100"
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-3 pointer-events-none sm:bottom-6 sm:right-6"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}