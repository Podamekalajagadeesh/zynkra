import { useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Variants accepted from object-form callers; mapped onto ToastType. */
export type ToastVariant = ToastType | 'destructive' | 'default';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  title?: string;
  description?: string;
}

/** Object form of a toast, e.g. addToast({ title, description, variant }). */
export interface ToastOptions {
  title?: string;
  /** Alias for `title` used by some call sites. */
  message?: string;
  description?: string;
  variant?: ToastVariant;
  /** Alias for `variant` used by some call sites. */
  type?: ToastVariant;
  duration?: number;
}

const VARIANT_TO_TYPE: Record<ToastVariant, ToastType> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
  destructive: 'error',
  default: 'info',
};

import { ToastContext } from './ToastContextDef';
export { useToast } from '../hooks/useToast';

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (input: string | ToastOptions, type: ToastType = 'info', duration = 4000) => {
      const id = Date.now().toString();
      const toast: Toast =
        typeof input === 'string'
          ? { id, message: input, type, duration }
          : (() => {
              const heading = input.title ?? input.message ?? '';
              return {
                id,
                message: input.description
                  ? `${heading}: ${input.description}`
                  : heading,
                title: input.title,
                description: input.description,
                type: VARIANT_TO_TYPE[input.variant ?? input.type ?? 'info'],
                duration: input.duration ?? 4000,
              };
            })();
      setToasts((prev) => [...prev, toast]);

      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, toast.duration);
      }
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, showToast: addToast, toast: addToast, removeToast }}
    >
      {children}
    </ToastContext.Provider>
  );
}