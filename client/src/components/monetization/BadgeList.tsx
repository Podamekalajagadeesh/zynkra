import { useEffect, useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { getBadges } from '../../lib/api';
import { Badge } from './Badge';
import { Skeleton } from '../ui/skeleton';
import { EmptyState } from '../ui/empty-state';
import { Award } from 'lucide-react';

export const BadgeList = ({ userId }: { userId: string }) => {
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const fetchBadges = async () => {
      try {
        setLoading(true);
        const data = await getBadges();
        if (!cancelled) {
          // If the API supports per-user filtering in the future, pass userId here
          setBadges(Array.isArray(data) ? data : data.badges ?? []);
        }
      } catch (error: any) {
        if (!cancelled) {
          addToast(
            error?.response?.data?.message || 'Failed to load badges',
            'error',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBadges();
    return () => { cancelled = true; };
  }, [userId, addToast]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton width={32} height={32} className="rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton width={100} height={14} />
              <Skeleton width={160} height={12} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!badges.length) {
    return (
      <EmptyState
        icon={<Award size={40} />}
        title="No badges yet"
        description="This user hasn't earned any badges yet."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {badges.map(badge => (
        <Badge key={badge.id} badge={badge} />
      ))}
    </div>
  );
};