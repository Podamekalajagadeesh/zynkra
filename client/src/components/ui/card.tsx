import { forwardRef, ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cardVariants = {
  default: 'bg-white border border-dark-200 shadow-sm dark:bg-dark-800 dark:border-dark-700',
  outline: 'border border-dark-200 bg-transparent dark:border-dark-700',
  ghost: 'bg-transparent',
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof cardVariants;
  children: ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        className={twMerge(
          clsx(
            'rounded-xl transition-all duration-200',
            cardVariants[variant],
            className,
          ),
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = 'Card';

export { Card };