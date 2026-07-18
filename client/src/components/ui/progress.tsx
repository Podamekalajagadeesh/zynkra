import React from 'react';

interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className = '' }: ProgressProps) {
  return (
    <div className={`h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <div 
        className="h-full bg-current transition-all duration-500 ease-in-out rounded-full"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

export default Progress;