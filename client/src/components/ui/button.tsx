import { forwardRef, ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const buttonVariants = {
  primary: 'bg-gradient-to-r from-primary-600 to-cyan-500 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/25',
  secondary: 'border border-dark-200 bg-white/90 text-dark-900 hover:bg-dark-50 dark:border-dark-700 dark:bg-dark-800 dark:text-white dark:hover:bg-dark-700',
  outline: 'border border-dark-200 bg-transparent text-dark-900 hover:bg-dark-50 dark:border-dark-700 dark:text-white dark:hover:bg-dark-800',
  ghost: 'text-dark-700 hover:bg-dark-100 dark:text-dark-200 dark:hover:bg-dark-800',
  destructive: 'bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700 hover:shadow-xl hover:shadow-red-600/25',
  accent: 'bg-gradient-to-r from-accent-600 to-fuchsia-500 text-white shadow-lg shadow-accent-500/20 hover:shadow-xl hover:shadow-accent-500/25',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm gap-2',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-6 py-3 text-lg gap-2',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  disabled?: boolean;
  icon?: ReactNode;
  isLoading?: boolean;
  ariaLabel?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled = false, isLoading = false, icon, children, ariaLabel, ...props }, ref) => {
    return (
      <button
        className={twMerge(
          clsx(
            'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 aria-busy:opacity-70 dark:focus:ring-offset-dark-900',
            buttonVariants[variant],
            buttonSizes[size],
            className,
          ),
        )}
        ref={ref}
        disabled={disabled || isLoading}
        aria-label={ariaLabel}
        aria-busy={isLoading}
        {...props}
      >
        {icon && <span className="inline-flex">{icon}</span>}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button };