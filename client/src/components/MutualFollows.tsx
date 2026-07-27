import { useEffect, useState } from 'react';
import { getMutualFollows } from '../lib/api';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Link } from 'react-router-dom';

interface MutualFollowUser {
  id: string;
  email?: string | null;
  nftPfpUrl?: string | null;
}

interface MutualFollowsProps {
  userId: string;
}

export function MutualFollows({ userId }: MutualFollowsProps) {
  const [mutualFollows, setMutualFollows] = useState<MutualFollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMutualFollows = async () => {
      try {
        const mutuals = await getMutualFollows(userId);
        setMutualFollows(mutuals);
      } catch (error) {
        console.error('Failed to fetch mutual follows:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMutualFollows();
  }, [userId]);

  if (loading) {
    return <div>Loading mutual follows...</div>;
  }

  if (mutualFollows.length === 0) {
    return null;
  }

  return (
    <div className="surface-soft p-4">
      <h3 className="text-lg font-semibold">Followed by</h3>
      <div className="mt-2 flex space-x-2">
        {mutualFollows.slice(0, 5).map((user) => (
          <Link to={`/users/${user.id}`} key={user.id}>
            <Avatar>
              <AvatarImage src={user.nftPfpUrl ?? ''} />
              <AvatarFallback>{user.email?.[0]}</AvatarFallback>
            </Avatar>
          </Link>
        ))}
      </div>
      {mutualFollows.length > 5 && (
        <p className="mt-2 text-sm text-dark-500">
          + {mutualFollows.length - 5} more
        </p>
      )}
    </div>
  );
}