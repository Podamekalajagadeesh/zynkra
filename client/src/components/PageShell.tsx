import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface PageShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  compact?: boolean;
}

export function PageShell({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  compact = false,
}: PageShellProps) {
  return (
    <div className={twMerge('relative isolate min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-8 sm:px-6 lg:px-8', className)}>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl animate-float-subtle" />
        <div className="absolute right-[-4rem] top-24 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl animate-float-subtle-delayed" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(39,192,255,0.08),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.08),_transparent_35%)]" />
      </div>

      <div className={twMerge('mx-auto w-full max-w-6xl', compact && 'max-w-4xl')}>
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-3">
            {eyebrow && (
              <p className="inline-flex w-fit items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:border-primary-900/60 dark:bg-primary-950/50 dark:text-primary-300">
                {eyebrow}
              </p>
            )}
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-dark-900 dark:text-white sm:text-4xl">
                {title}
              </h1>
              {description && (
                <p className="max-w-2xl text-sm leading-6 text-dark-600 dark:text-dark-300 sm:text-base">
                  {description}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
        </div>

        <div className={twMerge('rounded-[1.75rem] border border-white/70 bg-white/85 p-4 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-dark-700/80 dark:bg-dark-800/85 sm:p-6 animate-reveal-up', contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}
