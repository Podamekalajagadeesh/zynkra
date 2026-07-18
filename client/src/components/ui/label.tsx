import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={twMerge('text-sm font-semibold leading-none tracking-wide text-dark-800 dark:text-dark-200', className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Label.displayName = 'Label';

export { Label };