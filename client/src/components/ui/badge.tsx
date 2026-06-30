import React from 'react';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary-500 text-white hover:bg-primary-600',
  secondary: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
  outline: 'border border-gray-200 text-gray-900 dark:border-gray-700 dark:text-gray-100',
};

export function Badge({ variant = 'default', className = '', children }: BadgeProps) {
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;