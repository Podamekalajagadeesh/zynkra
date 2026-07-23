import { useAuth } from '../hooks/useAuth';
import { User } from 'lucide-react';
import type { UserProfile } from '../lib/types';

interface AvatarProps {
  className?: string;
  size?: number;
  user?: Partial<UserProfile> | null;
  userId?: string;
  src?: string;
  alt?: string;
  name?: string;
}

export function Avatar({ className, size = 40, user, userId, src, alt, name }: AvatarProps) {
  const { user: authUser } = useAuth();
  const avatarUser = user ?? (userId ? { id: userId } : null) ?? authUser;
  const displayName = name || avatarUser?.displayName || avatarUser?.username || 'User';

  const isNft = avatarUser?.nftPfpUrl && avatarUser.nftPfpContractAddress && avatarUser.nftPfpTokenId;
  const imageSrc = src || avatarUser?.pfp || avatarUser?.avatar || avatarUser?.profile?.avatarUrl || avatarUser?.nftPfpUrl;

  const baseClasses = 'flex items-center justify-center rounded-full object-cover';
  const nftClasses = isNft ? 'clip-path-hexagon' : '';
  const style = { width: size, height: size };

  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={alt || `${displayName} avatar`}
        className={`${baseClasses} ${nftClasses} ${className}`}
        style={style}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${baseClasses} ${className}`} style={style}>
      <User className="h-1/2 w-1/2 text-gray-500" />
    </div>
  );
}