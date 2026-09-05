import { useEffect, useState } from 'react';
import { Activity, Clock3 } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { getAccountHistory } from '../lib/api';

type HistoryEntry = Awaited<ReturnType<typeof getAccountHistory>>[number];

export default function AccountHistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAccountHistory()
      .then(setEntries)
      .catch(() => setError('Unable to load your account history right now.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell
      eyebrow="Account"
      title="Account history"
      description="Review security, recovery, settings, and lifecycle events recorded for your account."
    >
      {loading ? <p className="text-sm text-dark-500 dark:text-dark-400">Loading account history...</p> : null}
      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</p> : null}
      {!loading && !error && entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-dark-200 p-8 text-center dark:border-dark-700">
          <Activity className="mx-auto mb-3 text-dark-400" size={24} />
          <p className="text-sm text-dark-500 dark:text-dark-400">No account activity has been recorded yet.</p>
        </div>
      ) : null}
      {!loading && !error && entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((entry) => (
            <article key={entry.id} className="flex gap-3 rounded-xl border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-900/60">
              <div className="mt-0.5 rounded-lg bg-primary-50 p-2 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
                <Activity size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-dark-900 dark:text-white">{entry.summary}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-dark-500 dark:text-dark-400">
                    <Clock3 size={13} />
                    {new Date(entry.occurredAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-dark-500 dark:text-dark-400">{entry.type}</p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </PageShell>
  );
}
