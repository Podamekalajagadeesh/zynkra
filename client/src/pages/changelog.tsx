import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { getChangelog, type ChangelogEntry } from '../lib/api';

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      setEntries(await getChangelog());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <PageShell eyebrow="Product updates" title="Changelog" description="A transparent record of what has changed across Zynkra.">
      {loading ? <p className="text-dark-500">Loading updates...</p> : error ? (
        <div className="space-y-3 text-center"><p>We could not load the changelog.</p><Button onClick={load} icon={<RefreshCw size={15} />}>Try again</Button></div>
      ) : entries.length === 0 ? <p className="text-dark-500">No product updates have been published yet.</p> : (
        <div className="space-y-8">
          {entries.map((entry) => (
            <article key={entry.id} className="border-b border-dark-200 pb-8 last:border-0 last:pb-0 dark:border-dark-700">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div><p className="text-sm font-semibold text-primary-600">Version {entry.version}</p><h2 className="mt-1 text-2xl font-semibold">{entry.title}</h2></div>
                <time className="text-sm text-dark-500" dateTime={entry.publishedAt}>{new Date(entry.publishedAt).toLocaleDateString()}</time>
              </div>
              <p className="mt-4 whitespace-pre-wrap leading-7 text-dark-700 dark:text-dark-300">{entry.body}</p>
              <ul className="mt-5 space-y-2">{entry.changes.map((change) => <li key={change} className="flex gap-2 text-sm"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary-600" />{change}</li>)}</ul>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
