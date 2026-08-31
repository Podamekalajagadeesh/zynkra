import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Bell, Briefcase, ChevronRight, Clock3, Database, Lock, Shield, ShieldCheck, UserRound, Users } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { getAccountDashboard, getSecurityCenter, getVerificationStatus } from '../lib/api';

interface AccountDashboardData {
  account: {
    accountId: string;
    deactivated?: boolean;
    status?: string;
    switchingEnabled?: boolean;
  };
  preferences: {
    theme?: string;
    language?: string;
    timezone?: string;
  };
  notifications: {
    emailDigest?: boolean;
    pushAlerts?: boolean;
    securityAlerts?: boolean;
  };
  linkedAccounts: Array<{ provider: string; displayName?: string; email?: string; isPrimary?: boolean }>;
  history: Array<{ summary: string; occurredAt: string; type: string }>;
  privacy: {
    showOnlineStatus?: boolean;
    readReceipts?: boolean;
    mentions?: string;
    activityVisibility?: string;
  };
  recoveryStatus: { status?: string; method?: string } | null;
  appeals: Array<{ status?: string; reason?: string }>;
  securityCenter: {
    exportUrl?: string;
    logs?: Array<{ message: string; timestamp: string; type: string }>;
    connectedAccounts?: Array<{ provider: string }>;
    trustedDevices?: Array<{ deviceName: string }>;
    securityAlerts?: Array<{ message: string; severity?: string }>;
    pendingApprovals?: Array<{ deviceName: string }>;
  };
}

export default function AccountDashboardPage() {
  const [dashboard, setDashboard] = useState<AccountDashboardData | null>(null);
  const [securityCenter, setSecurityCenter] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [dashboardData, centerData, verificationData] = await Promise.all([
          getAccountDashboard(),
          getSecurityCenter(),
          getVerificationStatus(),
        ]);

        setDashboard(dashboardData);
        setSecurityCenter(centerData);
        setVerification(verificationData);
      } catch (err) {
        setError('Unable to load your account dashboard right now.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const account = dashboard?.account ?? {
      accountId: '',
      deactivated: false,
      status: 'active',
      switchingEnabled: false,
    };
    const center = securityCenter ?? {};
    const isDeactivated = Boolean(account.deactivated || account.status === 'deactivated');
    return [
      {
        label: 'Account status',
        value: isDeactivated ? 'Deactivated' : 'Active',
        icon: Shield,
      },
      {
        label: 'Linked accounts',
        value: String((dashboard?.linkedAccounts ?? []).length || (center.connectedAccounts ?? []).length || 0),
        icon: Users,
      },
      {
        label: 'Trusted devices',
        value: String((center.trustedDevices ?? []).length),
        icon: Lock,
      },
      {
        label: 'Verification',
        value: verification?.verified ? 'Verified' : (verification?.status ?? 'Not started'),
        icon: ShieldCheck,
      },
    ];
  }, [dashboard, securityCenter, verification]);

  if (loading) {
    return (
      <PageShell title="Account Dashboard" description="Loading your account overview...">
        <div className="rounded-2xl border border-dark-200 bg-white p-6 text-sm text-dark-600 dark:border-dark-700 dark:bg-dark-900/70 dark:text-dark-300">
          Loading account information...
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Account Dashboard" description="Your account overview.">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      </PageShell>
    );
  }

  const account = dashboard?.account ?? {
    accountId: '',
    deactivated: false,
    status: 'active',
    switchingEnabled: false,
  };
  const preferences = dashboard?.preferences ?? {};
  const notifications = dashboard?.notifications ?? {};
  const history = dashboard?.history ?? [];
  const privacy = dashboard?.privacy ?? {};
  const linkedAccounts = dashboard?.linkedAccounts ?? [];
  const recoveryStatus = dashboard?.recoveryStatus ?? securityCenter?.recoveryStatus ?? null;

  return (
    <PageShell
      eyebrow="Account"
      title="Account Dashboard"
      description="Review your account controls, security posture, privacy defaults, and verification state."
      action={
        <Link to="/settings">
          <Button variant="secondary">Open settings</Button>
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
              <div className="mb-3 inline-flex rounded-xl bg-primary-50 p-2 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
                <Icon size={18} />
              </div>
              <p className="text-sm text-dark-500 dark:text-dark-400">{label}</p>
              <p className="mt-2 text-xl font-semibold text-dark-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-dark-200 bg-white p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-dark-900 dark:text-white">Security Center</p>
                  <p className="text-sm text-dark-500 dark:text-dark-400">Recent account health and security activity.</p>
                </div>
                <Link to="/security-checkup" className="text-sm font-medium text-primary-600 dark:text-primary-300">
                  View details <ChevronRight size={14} className="inline" />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-dark-50 p-3 dark:bg-dark-800/80">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-dark-700 dark:text-dark-200"><Lock size={16} />Login approvals</div>
                  <div className="text-2xl font-semibold text-dark-900 dark:text-white">{(securityCenter?.pendingApprovals ?? []).length}</div>
                </div>
                <div className="rounded-xl bg-dark-50 p-3 dark:bg-dark-800/80">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-dark-700 dark:text-dark-200"><Shield size={16} />Security alerts</div>
                  <div className="text-2xl font-semibold text-dark-900 dark:text-white">{(securityCenter?.securityAlerts ?? []).length}</div>
                </div>
              </div>

              {recoveryStatus ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                  Recovery status: {recoveryStatus.status} via {recoveryStatus.method || 'email'}
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-dark-200 bg-white p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-dark-900 dark:text-white">Identity verification</p>
                  <p className="text-sm text-dark-500 dark:text-dark-400">Current verification status and history.</p>
                </div>
                <Link to="/request-verification" className="text-sm font-medium text-primary-600 dark:text-primary-300">
                  Manage <ChevronRight size={14} className="inline" />
                </Link>
              </div>

              <div className="rounded-xl border border-dark-200 bg-dark-50 p-4 dark:border-dark-700 dark:bg-dark-800/70">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-dark-500 dark:text-dark-400">Status</p>
                    <p className="text-lg font-semibold text-dark-900 dark:text-white">{verification?.status ?? 'not_started'}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${verification?.verified ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200'}`}>
                    {verification?.verified ? 'Verified' : 'Pending / not started'}
                  </span>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-dark-200 bg-white p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
              <p className="mb-4 text-lg font-semibold text-dark-900 dark:text-white">Privacy controls</p>
              <div className="space-y-3 text-sm text-dark-600 dark:text-dark-300">
                <div className="flex items-center justify-between"><span>Online status</span><span>{privacy.showOnlineStatus === false ? 'Hidden' : 'Visible'}</span></div>
                <div className="flex items-center justify-between"><span>Read receipts</span><span>{privacy.readReceipts === false ? 'Off' : 'On'}</span></div>
                <div className="flex items-center justify-between"><span>Activity visibility</span><span>{privacy.activityVisibility ?? 'friends'}</span></div>
                <div className="flex items-center justify-between"><span>Mentions</span><span>{privacy.mentions ?? 'everyone'}</span></div>
              </div>
              <div className="mt-4">
                <Link to="/privacy/shortcuts">
                  <Button variant="secondary" className="w-full">Manage privacy</Button>
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border border-dark-200 bg-white p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
              <p className="mb-4 text-lg font-semibold text-dark-900 dark:text-white">Preferences</p>
              <div className="space-y-3 text-sm text-dark-600 dark:text-dark-300">
                <div className="flex items-center justify-between"><span>Theme</span><span>{preferences.theme ?? 'system'}</span></div>
                <div className="flex items-center justify-between"><span>Language</span><span>{preferences.language ?? 'en-US'}</span></div>
                <div className="flex items-center justify-between"><span>Timezone</span><span>{preferences.timezone ?? 'UTC'}</span></div>
              </div>
            </section>
          </div>
        </div>

        <section className="rounded-2xl border border-dark-200 bg-white p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-lg font-semibold text-dark-900 dark:text-white">Recent account activity</p>
            <Database size={18} className="text-dark-400" />
          </div>

          {history.length === 0 ? (
            <div className="text-sm text-dark-500 dark:text-dark-400">No recent activity recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 6).map((entry, index) => (
                <div key={`${entry.summary}-${index}`} className="flex items-start justify-between gap-3 rounded-xl border border-dark-200 bg-dark-50 p-3 dark:border-dark-700 dark:bg-dark-800/70">
                  <div>
                    <p className="font-medium text-dark-900 dark:text-white">{entry.summary}</p>
                    <p className="text-xs text-dark-500 dark:text-dark-400">{entry.type}</p>
                  </div>
                  <div className="text-xs text-dark-500 dark:text-dark-400">
                    {new Date(entry.occurredAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-dark-200 bg-white p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-lg font-semibold text-dark-900 dark:text-white">Connected accounts</p>
            <UserRound size={18} className="text-dark-400" />
          </div>

          {linkedAccounts.length === 0 ? (
            <div className="text-sm text-dark-500 dark:text-dark-400">No connected external accounts yet.</div>
          ) : (
            <div className="space-y-3">
              {linkedAccounts.map((account, index) => (
                <div key={`${account.provider}-${index}`} className="flex items-center justify-between rounded-xl border border-dark-200 bg-dark-50 p-3 dark:border-dark-700 dark:bg-dark-800/70">
                  <div>
                    <p className="font-medium text-dark-900 dark:text-white">{account.provider}</p>
                    <p className="text-xs text-dark-500 dark:text-dark-400">{account.displayName ?? account.email ?? 'Connected account'}</p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-dark-500 dark:text-dark-400">{account.isPrimary ? 'Primary' : 'Linked'}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
