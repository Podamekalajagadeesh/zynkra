import React from 'react';
import { useLiveTrending } from '../hooks/useLiveTrending';
import { TrendingUp } from 'lucide-react';

export function LiveTrending() {
  const { trending } = useLiveTrending();

  if (trending.length === 0) return null;

  return (
    <div className="rounded-xl border border-dark-200 bg-white/80 p-4 dark:bg-dark-800">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary-500" />
        <h3 className="font-semibold">Trending live</h3>
      </div>
      <ol className="space-y-2">
        {trending.slice(0, 6).map((trend, index) => (
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
