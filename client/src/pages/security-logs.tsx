import { useEffect, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { getSecurityLogs, type SecurityAuditLogEntry } from '../lib/api';
import { AlertTriangle, ArrowUpRight, Clock3, Globe, Shield, Wifi } from 'lucide-react';

const severityClasses: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-200',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-200',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200',
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-200',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200',
};

const formatDate = (value?: string) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<SecurityAuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await getSecurityLogs({ take: 100, skip: 0 });
        setLogs(result.logs ?? []);
        setTotal(result.total ?? 0);
      } catch (err) {
        console.error('Failed to load security logs', err);
        setError('Unable to load your security log right now.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <PageShell
      eyebrow="Security"
      title="Security Logs"
      description="Review the persisted audit trail for sign-ins, recovery events, device approvals, and account security changes."
      action={
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard icon={<Shield size={18} />} label="Total events" value={String(total)} />
          <StatCard icon={<AlertTriangle size={18} />} label="High risk" value={String(logs.filter((log) => ['critical', 'high'].includes(String(log.severity))).length)} />
          <StatCard icon={<Clock3 size={18} />} label="Latest" value={logs[0] ? formatDate(logs[0].createdAt) : 'None'} />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl border border-dark-200 bg-white p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-dark-900 dark:text-white">Audit trail</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">Entries are stored in the backend security audit table and show the real account activity timeline.</p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-dashed border-dark-200 p-6 text-sm text-dark-500 dark:border-dark-700 dark:text-dark-300">
              Loading security logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-dark-200 p-6 text-sm text-dark-500 dark:border-dark-700 dark:text-dark-300">
              No security activity has been recorded for this account yet.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-dark-200 bg-dark-50/70 p-4 dark:border-dark-700 dark:bg-dark-900/50">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] ${severityClasses[String(log.severity ?? 'info')] || severityClasses.info}`}>
                          {log.severity ?? 'info'}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-dark-500 dark:text-dark-400">
                          {log.eventType ?? 'security_event'}
                        </span>
                      </div>
                      <p className="text-base font-medium text-dark-900 dark:text-white">
                        {log.message ?? log.description ?? 'Security event'}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-dark-500 dark:text-dark-400">
                        {log.ipAddress ? (
                          <span className="inline-flex items-center gap-1"><Wifi size={12} /> {log.ipAddress}</span>
                        ) : null}
                        {log.location ? (
                          <span className="inline-flex items-center gap-1"><Globe size={12} /> {log.location}</span>
                        ) : null}
                        <span className="inline-flex items-center gap-1"><Clock3 size={12} /> {formatDate(log.createdAt)}</span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-300">
                      View event <ArrowUpRight size={12} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
      <div className="mb-3 inline-flex rounded-xl bg-primary-50 p-2 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
        {icon}
      </div>
      <p className="text-sm text-dark-500 dark:text-dark-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-dark-900 dark:text-white">{value}</p>
    </div>
  );
}
