import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, AlertTriangle, CalendarClock, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';

type ServiceStatus = 'operational' | 'degraded' | 'not-configured' | 'unavailable';

interface PlatformStatus {
  status: 'operational' | 'degraded' | 'outage';
  version: string;
  environment: string;
  responseTimeMs: number;
  generatedAt: string;
  services: Record<string, { status: ServiceStatus; responseTimeMs?: number; detail?: string }>;
  activeIncidents: Incident[];
  upcomingMaintenance: MaintenanceWindow[];
  history: StatusSnapshot[];
}

interface Incident {
  id: string;
  title: string;
  message: string;
  service: string;
  impact: string;
  status: string;
  createdAt: string;
}

interface MaintenanceWindow {
  id: string;
  title: string;
  message: string;
  service: string;
  startsAt: string;
  endsAt: string;
  status: string;
}

interface StatusSnapshot {
  id: string;
  status: PlatformStatus['status'];
  responseTimeMs: number;
  generatedAt: string;
}

const statusMeta = {
  operational: { label: 'All systems operational', icon: CheckCircle2, className: 'text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950/30 dark:border-green-900' },
  degraded: { label: 'Some systems degraded', icon: AlertTriangle, className: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-900' },
  outage: { label: 'Service outage detected', icon: XCircle, className: 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-900' },
} as const;

export default function PlatformStatusPage() {
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get<PlatformStatus>('/infrastructure/health');
      setStatus(response.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading && !status) {
    return <PageShell title="Platform Status" eyebrow="Zynkra operations"><div className="surface-soft p-8 text-center">Checking live platform services...</div></PageShell>;
  }

  if (error && !status) {
    return (
      <PageShell title="Platform Status" eyebrow="Zynkra operations">
        <div className="surface-soft space-y-4 p-8 text-center">
          <XCircle className="mx-auto text-red-600" size={32} />
          <p>We could not retrieve the current platform status.</p>
          <Button variant="outline" onClick={fetchStatus} icon={<RefreshCw size={15} />}>Try again</Button>
        </div>
      </PageShell>
    );
  }

  const meta = statusMeta[status!.status];
  const StatusIcon = meta.icon;

  return (
    <PageShell title="Platform Status" eyebrow="Zynkra operations" description="Live operational status for core Zynkra services.">
      <div className="max-w-3xl space-y-6">
        <div className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 ${meta.className}`}>
          <div className="flex items-center gap-3">
            <StatusIcon size={24} />
            <div>
              <h2 className="text-lg font-semibold">{meta.label}</h2>
              <p className="text-sm opacity-80">Last checked {new Date(status!.generatedAt).toLocaleString()}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStatus} isLoading={loading} icon={<RefreshCw size={15} />}>Refresh</Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="Environment" value={status!.environment} />
          <Metric label="Version" value={status!.version} />
          <Metric label="Probe latency" value={`${status!.responseTimeMs} ms`} />
        </div>

        <div className="rounded-2xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900/70">
          <div className="mb-4 flex items-center gap-2"><Activity size={18} className="text-primary-600" /><h2 className="text-lg font-semibold">Service health</h2></div>
          <div className="divide-y divide-dark-100 dark:divide-dark-800">
            {Object.entries(status!.services).map(([name, service]) => (
              <div key={name} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div><p className="font-medium capitalize">{name.replace(/([A-Z])/g, ' $1')}</p>{service.detail && <p className="text-xs text-dark-500">{service.detail}</p>}</div>
                <div className="flex items-center gap-3">{service.responseTimeMs !== undefined && <span className="text-xs text-dark-500">{service.responseTimeMs} ms</span>}<Badge status={service.status} /></div>
              </div>
            ))}
          </div>
        </div>

        {status!.activeIncidents.length > 0 && (
          <StatusSection title="Active incidents" icon={<AlertTriangle size={18} className="text-amber-600" />}>
            {status!.activeIncidents.map((incident) => (
              <div key={incident.id} className="border-b border-dark-100 py-4 last:border-0 dark:border-dark-800">
                <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{incident.title}</h3><Badge status={incident.impact === 'critical' ? 'unavailable' : 'degraded'} /></div>
                <p className="mt-1 text-sm text-dark-600 dark:text-dark-300">{incident.message}</p>
                <p className="mt-2 text-xs text-dark-500">{incident.service} · {incident.status} · {new Date(incident.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </StatusSection>
        )}

        {status!.upcomingMaintenance.length > 0 && (
          <StatusSection title="Scheduled maintenance" icon={<CalendarClock size={18} className="text-primary-600" />}>
            {status!.upcomingMaintenance.map((maintenance) => (
              <div key={maintenance.id} className="border-b border-dark-100 py-4 last:border-0 dark:border-dark-800">
                <h3 className="font-semibold">{maintenance.title}</h3>
                <p className="mt-1 text-sm text-dark-600 dark:text-dark-300">{maintenance.message}</p>
                <p className="mt-2 text-xs text-dark-500">{maintenance.service} · {new Date(maintenance.startsAt).toLocaleString()} to {new Date(maintenance.endsAt).toLocaleString()}</p>
              </div>
            ))}
          </StatusSection>
        )}

        <StatusSection title="Recent checks" icon={<Activity size={18} className="text-primary-600" />}>
          <div className="space-y-3">
            {status!.history.map((check) => <div key={check.id} className="flex items-center justify-between text-sm"><span>{new Date(check.generatedAt).toLocaleString()}</span><span className="text-dark-500">{check.responseTimeMs} ms · {check.status}</span></div>)}
            {status!.history.length === 0 && <p className="text-sm text-dark-500">History will appear after the first live checks are recorded.</p>}
          </div>
        </StatusSection>
      </div>
    </PageShell>
  );
}

function StatusSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <div className="rounded-2xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900/70"><div className="mb-2 flex items-center gap-2"><span>{icon}</span><h2 className="text-lg font-semibold">{title}</h2></div>{children}</div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-900/70"><p className="text-xs uppercase tracking-wide text-dark-500">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>;
}

function Badge({ status }: { status: ServiceStatus }) {
  const labels: Record<ServiceStatus, string> = { operational: 'Operational', degraded: 'Degraded', 'not-configured': 'Not configured', unavailable: 'Unavailable' };
  const colors: Record<ServiceStatus, string> = { operational: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200', degraded: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200', 'not-configured': 'bg-dark-100 text-dark-700 dark:bg-dark-800 dark:text-dark-300', unavailable: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[status]}`}>{labels[status]}</span>;
}
