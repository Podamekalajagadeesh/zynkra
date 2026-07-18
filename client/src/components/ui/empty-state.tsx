import { ReactNode } from 'react';
import { Button } from './button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-xl text-center">
      <div className="text-dark-300 mb-md">{icon}</div>
      <h3 className="text-lg font-semibold text-dark-900 mb-sm">{title}</h3>
      <p className="text-dark-600 mb-lg max-w-xs">{description}</p>
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
