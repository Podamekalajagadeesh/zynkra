import React from 'react';

interface AlertProps {
  variant?: 'default' | 'destructive';
  className?: string;
  children: React.ReactNode;
}

const variantClasses = {
  default:
    'border-dark-200 bg-white text-dark-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-100',
  destructive:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300',
};

export function Alert({ variant = 'default', className = '', children }: AlertProps) {
  return (
    <div role="alert" className={`rounded-xl border p-4 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function AlertDescription({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`text-sm ${className}`}>{children}</div>;
}
