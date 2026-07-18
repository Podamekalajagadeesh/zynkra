import { ThreadFlair } from '../../lib/types';

interface FlairProps {
  flair: ThreadFlair;
  className?: string;
}

export const Flair = ({ flair, className = '' }: FlairProps) => {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${className}`}
      style={{
        backgroundColor: flair.color,
        color: flair.textColor,
      }}
    >
      {flair.name}
    </span>
  );
};