import { useEffect, useState } from 'react';
import { getBadges } from '../../lib/api';
import { Badge } from './Badge';

export const BadgeList = ({ userId }: { userId: string }) => {
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    // This is a placeholder for fetching a user's badges.
    // The current API doesn't support fetching badges for a specific user.
    // getBadges(userId).then(setBadges);
  }, [userId]);

  return (
    <div className="flex flex-col gap-4">
      {badges.map(badge => (
        <Badge key={badge.id} badge={badge} />
      ))}
    </div>
  );
};