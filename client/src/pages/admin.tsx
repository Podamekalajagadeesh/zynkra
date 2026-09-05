import { useState, useEffect } from 'react';
import { api, publishChangelog } from '../lib/api';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/useToast';
import { ModerationQueue } from '../components/moderation/ModerationQueue';
import { BiasDetectionDashboard } from '../components/moderation/BiasDetectionDashboard';
import { SentimentAnalyzer } from '../components/sentiment/SentimentAnalyzer';
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';

type ServiceStatus = 'operational' | 'degraded' | 'not-configured' | 'unavailable';

interface PlatformStatus {
  status: 'operational' | 'degraded' | 'outage';
  version: string;
  environment: string;
  responseTimeMs: number;
  generatedAt: string;
  services: Record<string, { status: ServiceStatus; responseTimeMs?: number; detail?: string }>;
  activeIncidents: PlatformIncident[];
  upcomingMaintenance: PlatformMaintenance[];
  history: Array<{ id: string; status: PlatformStatus['status']; responseTimeMs: number; generatedAt: string }>;
}

interface PlatformIncident {
  id: string;
  title: string;
  message: string;
  service: string;
  impact: 'minor' | 'major' | 'critical';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  createdAt: string;
}

interface PlatformMaintenance {
  id: string;
  title: string;
  message: string;
  service: string;
  startsAt: string;
  endsAt: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

interface PendingVerification {
  id: string;
  category: string;
  justification: string;
  links: string[];
  createdAt: string;
  user: {
    id: string;
    username: string | null;
    displayName?: string | null;
    email: string | null;
    isPremium?: boolean;
  };
}

export function AdminPage() {
  const { addToast } = useToast();
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [activeTab, setActiveTab] = useState<'verifications' | 'moderation' | 'bias' | 'sentiment' | 'status' | 'changelog'>('verifications');
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const handlePublishChangelog = async (input: { version: string; title: string; body: string; changes: string[] }) => {
    try {
      await publishChangelog(input);
      addToast('Changelog published', 'success');
    } catch {
      addToast('Failed to publish changelog', 'error');
    }
  };

  const fetchPendingVerifications = async () => {
    try {
      const response = await api.get('/verification/pending');
      setPendingVerifications(response.data);
    } catch (error) {
      addToast('Failed to load pending verification requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await api.post(`/verification/${requestId}/review`, { decision: 'approved' });
      addToast('User verified successfully!', 'success');
      fetchPendingVerifications();
    } catch (error) {
      addToast('Failed to verify user', 'error');
    }
  };

  const handleReject = async (requestId: string) => {
    const reviewNote = window.prompt('Reason for rejection (shown to the applicant):') ?? undefined;
    try {
      await api.post(`/verification/${requestId}/review`, { decision: 'rejected', reviewNote });
      addToast('Verification request rejected', 'success');
      fetchPendingVerifications();
    } catch (error) {
      addToast('Failed to reject verification request', 'error');
    }
  };

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPlatformStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await api.get<PlatformStatus>('/infrastructure/status');
      setPlatformStatus(response.data);
    } catch {
      addToast('Failed to load platform status', 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  const createIncident = async (payload: Record<string, string>) => {
    try {
      await api.post('/infrastructure/incidents', payload);
      addToast('Incident published', 'success');
      fetchPlatformStatus();
    } catch {
      addToast('Failed to publish incident', 'error');
    }
  };

  const resolveIncident = async (id: string) => {
    try {
      await api.patch(`/infrastructure/incidents/${id}`, { status: 'resolved' });
      addToast('Incident resolved', 'success');
      fetchPlatformStatus();
    } catch {
      addToast('Failed to resolve incident', 'error');
    }
  };

  const createMaintenance = async (payload: Record<string, string>) => {
    try {
      await api.post('/infrastructure/maintenance', payload);
      addToast('Maintenance window scheduled', 'success');
      fetchPlatformStatus();
    } catch {
      addToast('Failed to schedule maintenance', 'error');
    }
  };

  useEffect(() => {
    if (activeTab === 'status') {
      fetchPlatformStatus();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <PageShell title="Admin Dashboard">
        <div>Loading...</div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Admin Dashboard">
      <div className="space-y-6">
        <div className="flex gap-4 border-b pb-4">
          <Button 
            variant={activeTab === 'verifications' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('verifications')}
          >
            Verification Requests
          </Button>
          <Button
            variant={activeTab === 'moderation' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('moderation')}
          >
            Content Moderation
          </Button>
          <Button
            variant={activeTab === 'bias' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('bias')}
          >
            Bias Detection
          </Button>
          <Button
            variant={activeTab === 'sentiment' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('sentiment')}
          >
            Sentiment
          </Button>
          <Button
            variant={activeTab === 'status' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('status')}
          >
            Platform Status
          </Button>
          <Button
            variant={activeTab === 'changelog' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('changelog')}
          >
            Changelog
          </Button>
        </div>

        {activeTab === 'verifications' && (
          <>
            <h2 className="text-xl font-bold">Pending Verification Requests</h2>
            {pendingVerifications.length === 0 ? (
              <p className="text-gray-500">No pending verification requests.</p>
            ) : (
              <div className="space-y-4">
                {pendingVerifications.map((request) => (
            <div key={request.id} className={`p-4 border rounded-lg space-y-3 ${request.user.isPremium ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-800' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {request.user.displayName || request.user.username || request.user.email}
                    <span className="text-xs bg-dark-200 text-dark-700 px-2 py-0.5 rounded-full capitalize dark:bg-dark-700 dark:text-dark-200">
                      {request.category}
                    </span>
                    {request.user.isPremium && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        Premium - Priority
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">{request.user.email}</p>
                  <p className="text-sm text-gray-500">
                    Submitted: {new Date(request.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{request.justification}</p>
                  {request.links.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {request.links.map((link) => (
                        <li key={link}>
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline break-all">
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                      <div className="flex gap-2">
                        <Button variant="default" onClick={() => handleApprove(request.id)}>
                          Approve
                        </Button>
                        <Button variant="destructive" onClick={() => handleReject(request.id)}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'moderation' && (
          <div>
            <ModerationQueue />
          </div>
        )}

        {activeTab === 'bias' && (
          <div>
            <BiasDetectionDashboard />
          </div>
        )}

        {activeTab === 'sentiment' && (
          <div>
            <SentimentAnalyzer />
          </div>
        )}

        {activeTab === 'status' && (
          <PlatformStatusPanel
            status={platformStatus}
            loading={statusLoading}
            onRefresh={fetchPlatformStatus}
            onCreateIncident={createIncident}
            onResolveIncident={resolveIncident}
            onCreateMaintenance={createMaintenance}
          />
        )}

        {activeTab === 'changelog' && <ChangelogForm onSubmit={handlePublishChangelog} />}
      </div>
    </PageShell>
  );
}

function PlatformStatusPanel({
  status,
  loading,
  onRefresh,
  onCreateIncident,
  onResolveIncident,
  onCreateMaintenance,
}: {
  status: PlatformStatus | null;
  loading: boolean;
  onRefresh: () => void;
  onCreateIncident: (payload: Record<string, string>) => void;
  onResolveIncident: (id: string) => void;
  onCreateMaintenance: (payload: Record<string, string>) => void;
}) {
  const statusMeta = {
    operational: { label: 'All systems operational', icon: CheckCircle2, className: 'text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950/30 dark:border-green-900' },
    degraded: { label: 'Some systems degraded', icon: AlertTriangle, className: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-900' },
    outage: { label: 'Service outage detected', icon: XCircle, className: 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-900' },
  } as const;

  if (loading && !status) {
    return <div className="surface-soft p-8 text-center">Checking live platform services...</div>;
  }

  if (!status) {
    return <div className="surface-soft p-8 text-center">No platform status is available.</div>;
  }

  const meta = statusMeta[status.status];
  const StatusIcon = meta.icon;

  return (
    <div className="space-y-6">
      <div className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 ${meta.className}`}>
        <div className="flex items-center gap-3">
          <StatusIcon size={24} />
          <div>
            <h2 className="text-lg font-semibold">{meta.label}</h2>
            <p className="text-sm opacity-80">Last checked {new Date(status.generatedAt).toLocaleString()}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} isLoading={loading} icon={<RefreshCw size={15} />}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatusMetric label="Environment" value={status.environment} />
        <StatusMetric label="Version" value={status.version} />
        <StatusMetric label="Probe latency" value={`${status.responseTimeMs} ms`} />
      </div>

      <div className="rounded-2xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900/70">
        <div className="mb-4 flex items-center gap-2">
          <Activity size={18} className="text-primary-600" />
          <h2 className="text-lg font-semibold">Service health</h2>
        </div>
        <div className="divide-y divide-dark-100 dark:divide-dark-800">
          {Object.entries(status.services).map(([name, service]) => (
            <div key={name} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium capitalize">{name.replace(/([A-Z])/g, ' $1')}</p>
                {service.detail && <p className="text-xs text-dark-500 dark:text-dark-400">{service.detail}</p>}
              </div>
              <div className="flex items-center gap-3">
                {service.responseTimeMs !== undefined && <span className="text-xs text-dark-500">{service.responseTimeMs} ms</span>}
                <StatusBadge status={service.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <IncidentForm onSubmit={onCreateIncident} />
        <MaintenanceForm onSubmit={onCreateMaintenance} />
      </div>

      {status.activeIncidents.length > 0 && (
        <div className="rounded-2xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900/70">
          <h2 className="mb-3 text-lg font-semibold">Active incidents</h2>
          <div className="space-y-3">{status.activeIncidents.map((incident) => <div key={incident.id} className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-0"><div><p className="font-medium">{incident.title}</p><p className="text-sm text-dark-500">{incident.service} · {incident.impact} · {incident.status}</p></div><Button size="sm" variant="outline" onClick={() => onResolveIncident(incident.id)}>Resolve</Button></div>)}</div>
        </div>
      )}

      {status.upcomingMaintenance.length > 0 && (
        <div className="rounded-2xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900/70">
          <h2 className="mb-3 text-lg font-semibold">Scheduled maintenance</h2>
          <div className="space-y-3">{status.upcomingMaintenance.map((maintenance) => <div key={maintenance.id}><p className="font-medium">{maintenance.title}</p><p className="text-sm text-dark-500">{maintenance.service} · {new Date(maintenance.startsAt).toLocaleString()} to {new Date(maintenance.endsAt).toLocaleString()}</p></div>)}</div>
        </div>
      )}
    </div>
  );
}

const fieldClass = 'w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm dark:border-dark-700 dark:bg-dark-900';

function IncidentForm({ onSubmit }: { onSubmit: (payload: Record<string, string>) => void }) {
  const [form, setForm] = useState({ title: '', message: '', service: 'api', impact: 'minor' });
  return <form className="space-y-3 rounded-2xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900/70" onSubmit={(event) => { event.preventDefault(); onSubmit(form); setForm({ title: '', message: '', service: 'api', impact: 'minor' }); }}><h2 className="text-lg font-semibold">Publish incident</h2><input className={fieldClass} placeholder="Incident title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><textarea className={fieldClass} placeholder="What is happening?" required value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /><div className="grid grid-cols-2 gap-3"><input className={fieldClass} placeholder="Service" required value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })} /><select className={fieldClass} value={form.impact} onChange={(event) => setForm({ ...form, impact: event.target.value })}><option value="minor">Minor impact</option><option value="major">Major impact</option><option value="critical">Critical impact</option></select></div><Button type="submit">Publish incident</Button></form>;
}

function MaintenanceForm({ onSubmit }: { onSubmit: (payload: Record<string, string>) => void }) {
  const [form, setForm] = useState({ title: '', message: '', service: 'api', startsAt: '', endsAt: '' });
  return <form className="space-y-3 rounded-2xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900/70" onSubmit={(event) => { event.preventDefault(); onSubmit({ ...form, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString() }); setForm({ title: '', message: '', service: 'api', startsAt: '', endsAt: '' }); }}><h2 className="text-lg font-semibold">Schedule maintenance</h2><input className={fieldClass} placeholder="Maintenance title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><textarea className={fieldClass} placeholder="What will change?" required value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /><input className={fieldClass} placeholder="Service" required value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })} /><div className="grid grid-cols-2 gap-3"><input className={fieldClass} type="datetime-local" required value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /><input className={fieldClass} type="datetime-local" required value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></div><Button type="submit">Schedule maintenance</Button></form>;
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-900/70">
      <p className="text-xs uppercase tracking-wide text-dark-500 dark:text-dark-400">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  const labels: Record<ServiceStatus, string> = {
    operational: 'Operational',
    degraded: 'Degraded',
    'not-configured': 'Not configured',
    unavailable: 'Unavailable',
  };
  const colors: Record<ServiceStatus, string> = {
    operational: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
    degraded: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    'not-configured': 'bg-dark-100 text-dark-700 dark:bg-dark-800 dark:text-dark-300',
    unavailable: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  };

  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[status]}`}>{labels[status]}</span>;
}

function ChangelogForm({ onSubmit }: { onSubmit: (input: { version: string; title: string; body: string; changes: string[] }) => void }) {
  const [form, setForm] = useState({ version: '', title: '', body: '', changes: '' });
  return (
    <form className="max-w-2xl space-y-4 rounded-2xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900/70" onSubmit={(event) => {
      event.preventDefault();
      onSubmit({ ...form, changes: form.changes.split('\n').map((change) => change.trim()).filter(Boolean) });
      setForm({ version: '', title: '', body: '', changes: '' });
    }}>
      <div><h2 className="text-lg font-semibold">Publish changelog entry</h2><p className="text-sm text-dark-500">One change per line. Published entries are visible at /changelog.</p></div>
      <input className={fieldClass} placeholder="Version, for example 1.4.0" required value={form.version} onChange={(event) => setForm({ ...form, version: event.target.value })} />
      <input className={fieldClass} placeholder="Release title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
      <textarea className={fieldClass} rows={5} placeholder="Release summary" required value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} />
      <textarea className={fieldClass} rows={6} placeholder={'Added persistent changelog storage\nAdded public changelog page'} required value={form.changes} onChange={(event) => setForm({ ...form, changes: event.target.value })} />
      <Button type="submit">Publish changelog</Button>
    </form>
  );
}