import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={twMerge(
          'flex h-11 w-full rounded-xl border border-dark-200 bg-white/90 px-4 py-2 text-sm text-dark-900 placeholder:text-dark-400 shadow-sm backdrop-blur-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-dark-700 dark:bg-dark-900/80 dark:text-white dark:placeholder:text-dark-500',
          className,
        )}
        ref={ref}
        aria-invalid={props['aria-invalid'] || false}
        aria-describedby={props['aria-describedby']}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };