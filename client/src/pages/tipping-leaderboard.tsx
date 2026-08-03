import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTippingLeaderboard } from '../lib/api';
import { PageShell } from '../components/PageShell';
import { Skeleton } from '../components/ui/skeleton';
import { Trophy, Crown } from 'lucide-react';

type Period = 'all' | 'weekly' | 'monthly';

interface LeaderboardEntry {
  rank: number;
  totalAmount: number;
  tipCount: number;
  user: {
    id: string;
    username?: string | null;
    displayName?: string | null;
    avatar?: string | null;
  };
}

const PERIODS: { key: Period; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: 'weekly', label: 'This week' },
  { key: 'monthly', label: 'This month' },
];

const currency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);

export const TippingLeaderboardPage = () => {
  const [period, setPeriod] = useState<Period>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getTippingLeaderboard(period)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <PageShell
      eyebrow="Creator economy"
      title="Tipping Leaderboard"
      description="Creators who earned the most in tips across Zynkra."
    >
      <div className="mb-4 inline-flex rounded-lg border border-dark-200 dark:border-dark-700 p-1">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              period === key
                ? 'bg-primary-500 text-white'
                : 'text-dark-600 hover:bg-dark-100 dark:hover:bg-dark-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-12 text-center text-dark-500">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No tips recorded for this period yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-dark-200 dark:border-dark-700">
          {entries.map((entry, i) => (
            <div
              key={entry.user.id}
              className={`flex items-center gap-4 px-4 py-3 ${
                i % 2 === 0
                  ? 'bg-white dark:bg-dark-800'
                  : 'bg-dark-50 dark:bg-dark-900'
              }`}
            >
              <div className="w-10 flex justify-center">
                {entry.rank === 1 ? (
                  <Crown className="w-5 h-5 text-yellow-500" />
                ) : (
                  <span className="text-dark-500 font-semibold tabular-nums">
                    #{entry.rank}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/u/${entry.user.username || entry.user.id}`}
                  className="flex items-center gap-3 hover:underline"
                >
                  {entry.user.avatar ? (
                    <img
                      src={entry.user.avatar}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-dark-200 dark:bg-dark-700 flex items-center justify-center text-dark-500">
                      {(entry.user.displayName || entry.user.username || '?')
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium text-dark-900 dark:text-dark-100 truncate">
                    {entry.user.displayName || entry.user.username || 'Anonymous'}
                  </span>
                </Link>
              </div>
              <div className="text-right">
                <div className="font-semibold text-dark-900 dark:text-dark-100 tabular-nums">
                  {currency(entry.totalAmount)}
                </div>
                <div className="text-xs text-dark-500">
                  {entry.tipCount} tip{entry.tipCount === 1 ? '' : 's'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
};
