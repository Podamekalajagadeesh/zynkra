import { BadgeCheck, Check, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export interface VerificationBadgeProps {
  type?: 'identity' | 'creator' | 'business' | 'organization' | 'age';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const badgeConfig = {
  identity: {
    label: 'Verified',
    icon: BadgeCheck,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    description: 'Identity verified',
  },
  creator: {
    label: 'Creator',
    icon: BadgeCheck,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    description: 'Creator verified',
  },
  business: {
    label: 'Business',
    icon: BadgeCheck,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    description: 'Business verified',
  },
  organization: {
    label: 'Organization',
    icon: BadgeCheck,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    description: 'Organization verified',
  },
  age: {
    label: 'Age Verified',
    icon: Check,
    color: 'text-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    description: 'Age 18+ verified',
  },
};

const sizeConfig = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function VerificationBadge({
  type = 'identity',
  size = 'md',
  showLabel = false,
  className,
}: VerificationBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  if (!showLabel) {
    return (
      <div className={cn('inline-flex items-center', className)} title={config.description}>
        <Icon className={cn(sizeConfig[size], config.color, 'flex-shrink-0')} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        config.bgColor,
        config.color,
        className,
      )}
      title={config.description}
    >
      <Icon className={cn(sizeConfig[size], 'flex-shrink-0')} />
      <span>{config.label}</span>
    </div>
  );
}

export interface VerificationBadgesProps {
  badges?: string[];
  isVerified?: boolean;
  className?: string;
}

export function VerificationBadges({
  badges = [],
  isVerified = false,
  className,
}: VerificationBadgesProps) {
  if (!badges.length && !isVerified) {
    return null;
  }

  const uniqueBadges = Array.from(new Set(badges));

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {isVerified && <VerificationBadge type="identity" showLabel size="sm" />}
      {uniqueBadges.map((badge) => {
        const typedBadge = badge as keyof typeof badgeConfig;
        if (badgeConfig[typedBadge]) {
          return <VerificationBadge key={badge} type={typedBadge} showLabel size="sm" />;
        }
        return null;
      })}
    </div>
  );
}
