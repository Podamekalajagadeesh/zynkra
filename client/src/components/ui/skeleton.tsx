import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ width = '100%', height = 12, className = '' }: SkeletonProps) {
  const style: React.CSSProperties = {
    width,
    height,
  };

  return <div className={`bg-dark-100 animate-pulse rounded-md ${className}`} style={style} />;
}

export default Skeleton;
