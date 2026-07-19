interface PresenceDotProps {
  online: boolean;
  className?: string;
}

/** Green "active now" dot, rendered only when the user is online. */
export function PresenceDot({ online, className = '' }: PresenceDotProps) {
  if (!online) return null;
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-dark-800 ${className}`}
      title="Active now"
      aria-label="Active now"
    />
  );
}
