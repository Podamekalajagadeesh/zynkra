import React, { useEffect, useState } from 'react';
import { useLiveTrending } from '../hooks/useLiveTrending';
import { TrendingUp } from 'lucide-react';
import { getTrendingTopics } from '../lib/api';

export function LiveTrending() {
  const { trending } = useLiveTrending();
  const [days, setDays] = useState(7);
  const [historicalTrending, setHistoricalTrending] = useState(trending);

  useEffect(() => {
    getTrendingTopics(days)
      .then((response) => setHistoricalTrending(response.globalTrends || []))
      .catch(() => setHistoricalTrending(trending));
  }, [days, trending]);

  if (historicalTrending.length === 0) return null;

  return (
    <div className="rounded-xl border border-dark-200 bg-white/80 p-4 dark:bg-dark-800">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary-500" />
        <h3 className="font-semibold">Trending topics</h3>
        <select
          aria-label="Trend time range"
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          className="ml-auto rounded border border-dark-200 bg-white px-2 py-1 text-xs dark:border-dark-700 dark:bg-dark-900"
        >
          <option value={1}>24 hours</option>
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
        </select>
      </div>
      <ol className="space-y-2">
        {historicalTrending.slice(0, 6).map((trend, index) => (
          <li key={trend.tag} className="flex items-center justify-between text-sm">
            <span className="text-gray-400">#{index + 1}</span>
            <span className="font-medium">{trend.tag.replace(/^#/, '')}</span>
            <span className="text-xs text-gray-500">{trend.occurrenceCount} posts</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
