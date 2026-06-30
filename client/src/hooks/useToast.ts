import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContextDef';

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}