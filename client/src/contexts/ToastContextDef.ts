import { createContext } from 'react';
import { Toast, ToastOptions, ToastType } from './ToastContext';

type AddToast = (input: string | ToastOptions, type?: ToastType, duration?: number) => void;

interface ToastContextType {
  toasts: Toast[];
  addToast: AddToast;
  /** Aliases for addToast used across the codebase. */
  showToast: AddToast;
  toast: AddToast;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);