import React from 'react';

interface AvatarProps {
  name?: string;
  size?: number; // px
  className?: string;
  children?: React.ReactNode;
}

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Avatar({ name = 'A', size = 40, className = '', children }: AvatarProps) {
  const initial = (name || 'A').trim().charAt(0).toUpperCase();
  const style: React.CSSProperties = {
    width: size,
    height: size,
  };

  if (children) {
    return (
      <div
        className={`relative rounded-full overflow-hidden flex items-center justify-center ${className}`}
        style={style}
        aria-hidden="true"
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white select-none ${className}`}
      style={style}
      aria-hidden="true"
    >
      <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-accent-400">
        <span className="text-sm" style={{ fontSize: Math.max(12, size / 2.5) }}>{initial}</span>
      </div>
    </div>
  );
}

export function AvatarImage({ className = '', ...props }: AvatarImageProps) {
  return (
    <img
      className={`h-full w-full object-cover ${className}`}
      {...props}
    />
  );
}

export function AvatarFallback({ className = '', children, ...props }: AvatarFallbackProps) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-400 to-accent-400 font-semibold text-white ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Avatar;
