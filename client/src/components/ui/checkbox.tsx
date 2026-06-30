import { forwardRef } from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <label
        className={twMerge(
          clsx(
            'inline-flex h-5 w-5 items-center justify-center rounded border border-dark-300 bg-white text-white transition-colors',
            checked && 'border-primary-600 bg-primary-600',
            disabled && 'cursor-not-allowed opacity-50',
            className,
          ),
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange?.(event.target.checked)}
          {...props}
        />
        {checked && <Check size={14} strokeWidth={3} />}
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };