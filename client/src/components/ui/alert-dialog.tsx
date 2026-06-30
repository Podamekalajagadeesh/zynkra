import React from 'react';

type AlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => onOpenChange(false)}
      role="presentation"
    >
      <div
        className="w-full max-w-lg"
        onClick={(event) => event.stopPropagation()}
        role="presentation"
      >
        {children}
      </div>
    </div>
  );
}

export function AlertDialogContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dark-200 bg-white p-6 shadow-xl dark:border-dark-700 dark:bg-dark-900">
      {children}
    </div>
  );
}

export function AlertDialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

export function AlertDialogTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-semibold text-dark-900 dark:text-white">{children}</h3>;
}

export function AlertDialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-dark-500 dark:text-dark-300">{children}</p>;
}

export function AlertDialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex justify-end gap-2">{children}</div>;
}

export function AlertDialogCancel({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="rounded-xl border border-dark-200 px-4 py-2 text-sm font-medium text-dark-700 hover:bg-dark-50 dark:border-dark-700 dark:text-dark-200 dark:hover:bg-dark-800"
    >
      {children}
    </button>
  );
}

export function AlertDialogAction({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
    >
      {children}
    </button>
  );
}
