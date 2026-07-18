import {
  createContext,
  forwardRef,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type SelectContextValue = {
  value?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onValueChange: (value: string) => void;
  registerOption: (value: string, label: string) => void;
  getLabel: (value?: string) => string | undefined;
};

const SelectContext = createContext<SelectContextValue | null>(null);

export interface SelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Record<string, string>>({});

  const contextValue = useMemo<SelectContextValue>(() => ({
    value,
    open,
    setOpen,
    onValueChange,
    registerOption: (optionValue: string, label: string) => {
      setOptions((current) => (current[optionValue] === label ? current : { ...current, [optionValue]: label }));
    },
    getLabel: (optionValue?: string) => (optionValue ? options[optionValue] : undefined),
  }), [value, open, onValueChange, options]);

  return <SelectContext.Provider value={contextValue}>{children}</SelectContext.Provider>;
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, type = 'button', ...props }, ref) => {
    const context = useSelectContext();

    return (
      <button
        ref={ref}
        type={type}
        aria-haspopup="listbox"
        aria-expanded={context.open}
        onClick={() => context.setOpen(!context.open)}
        className={twMerge(
          clsx(
            'inline-flex w-full items-center justify-between gap-2 rounded-xl border border-dark-200 bg-white px-4 py-2 text-left text-sm text-dark-900 shadow-sm transition-colors hover:bg-dark-50 dark:border-dark-700 dark:bg-dark-900 dark:text-white dark:hover:bg-dark-800',
            className,
          ),
        )}
        {...props}
      >
        {children}
        <ChevronDown size={16} className="shrink-0 opacity-70" />
      </button>
    );
  },
);

SelectTrigger.displayName = 'SelectTrigger';

export interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const context = useSelectContext();
  const label = context.getLabel(context.value);

  return <span>{label ?? placeholder ?? ''}</span>;
}

export interface SelectContentProps {
  children: ReactNode;
  className?: string;
}

export function SelectContent({ children, className }: SelectContentProps) {
  const context = useSelectContext();

  if (!context.open) {
    return <div className="hidden">{children}</div>;
  }

  return (
    <div
      role="listbox"
      className={twMerge(
        clsx(
          'mt-2 rounded-xl border border-dark-200 bg-white p-1 shadow-lg dark:border-dark-700 dark:bg-dark-900',
          className,
        ),
      )}
    >
      {children}
    </div>
  );
}

export interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const SelectItem = forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ value, children, className, type = 'button', ...props }, ref) => {
    const context = useSelectContext();

    useEffect(() => {
      context.registerOption(value, typeof children === 'string' ? children : value);
    }, [context, value, children]);

    return (
      <button
        ref={ref}
        type={type}
        role="option"
        aria-selected={context.value === value}
        onClick={() => {
          context.onValueChange(value);
          context.setOpen(false);
        }}
        className={twMerge(
          clsx(
            'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-dark-900 transition-colors hover:bg-dark-100 dark:text-white dark:hover:bg-dark-800',
            context.value === value && 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-200',
            className,
          ),
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

SelectItem.displayName = 'SelectItem';

function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within <Select>');
  }
  return context;
}