import { useAuth } from '../hooks/useAuth';
import { User } from 'lucide-react';

interface AvatarProps {
  className?: string;
}

export function Avatar({ className }: AvatarProps) {
  const { user } = useAuth();

  const isNft = user?.nftPfpUrl && user.nftPfpContractAddress && user.nftPfpTokenId;

  const baseClasses = 'flex items-center justify-center rounded-full object-cover';
  const nftClasses = isNft ? 'clip-path-hexagon' : '';

  if (user?.nftPfpUrl) {
    return (
      <img
        src={user.nftPfpUrl}
        alt="User Avatar"
        className={`${baseClasses} ${nftClasses} ${className}`}
      />
    );
  }

  if (user?.pfp) {
    return (
      <img
        src={user.pfp}
        alt="User Avatar"
        className={`${baseClasses} ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${baseClasses} ${className}`}>
      <User className="h-1/2 w-1/2 text-gray-500" />
    </div>
  );
}