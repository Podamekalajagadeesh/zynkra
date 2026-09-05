
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BellRing, Brain, Clock3, RefreshCw, ShieldAlert, ShieldCheck, Smartphone, UserCheck, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import {
  approveLoginSession,
  getAccountDashboard,
  getLoginSessions,
  getPendingLoginSessions,
  revokeLoginSession,
  revokeOtherSessions,
  type LoginSession,
  getBrainwaveDevices,
  registerBrainwaveDevice,
  removeBrainwaveDevice,
  getSecurityAlerts,
  resolveSecurityAlert,
  reopenSecurityAlert,
  startAccountRecovery,
  completeAccountRecovery,
  type SecurityAlert,
} from '../lib/api';
import { formatDateTime } from '../lib/preferences';
import { useNotifications } from '../providers/notifications-provider';

function getSessionLabel(session: LoginSession) {
  return session.deviceName || session.userAgent || 'Unknown device';
}

export function SecurityCheckupPage() {
  const { activeAccount } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [pendingSessions, setPendingSessions] = useState<LoginSession[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [brainwaveDevices, setBrainwaveDevices] = useState<any[]>([]);
  const [recoveryStatus, setRecoveryStatus] = useState<{ status?: string; method?: string; createdAt?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingSessionId, setWorkingSessionId] = useState<string | null>(null);
  const [registeringBrainwave, setRegisteringBrainwave] = useState(false);

  const loadSecurityData = async () => {
    if (!activeAccount) {
      setLoading(false);
      return;
    }

    try {
      const [allSessions, pending, alerts] = await Promise.all([
        getLoginSessions(),
        getPendingLoginSessions(),
        getSecurityAlerts(),
      ]);
      setSessions(allSessions);
      setPendingSessions(pending);
      setSecurityAlerts(alerts);

      try {
        const dashboard = await getAccountDashboard();
        setRecoveryStatus(dashboard.recoveryStatus ?? null);
      } catch {
        setRecoveryStatus(null);
      }

      // Brainwave devices are aspirational/best-effort — a missing endpoint must
      // never prevent sessions and pending approvals from loading.
      getBrainwaveDevices()
        .then(setBrainwaveDevices)
        .catch(() => setBrainwaveDevices([]));
    } catch (error) {
      console.error('Failed to load security data', error);
      toast.error('Failed to load security data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, [activeAccount]);

  const loginAlerts = useMemo(
    () => notifications.filter((notification) => notification.type === 'login_alert'),
    [notifications],
  );

  const suspiciousSessions = useMemo(
    () => sessions.filter((session) => session.suspicious && !session.isRevoked),
    [sessions],
  );

  const currentSession = useMemo(
    () => sessions.find((session) => session.isCurrent) ?? null,
    [sessions],
  );

  const refreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadSecurityData(), fetchNotifications()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleApproveSession = async (sessionId: string) => {
    setWorkingSessionId(sessionId);
    try {
      await approveLoginSession(sessionId);
      await refreshAll();
      toast.success('Session approved.');
    } catch (error) {
      console.error('Failed to approve session', error);
      toast.error('Failed to approve session.');
    } finally {
      setWorkingSessionId(null);
    }
  };

  const handleStartAccountRecovery = async () => {
    try {
      const result = await startAccountRecovery('email');
      setRecoveryStatus(result);
      toast.success('Account recovery request started.');
    } catch (error) {
      console.error('Failed to start account recovery', error);
      toast.error('Failed to start account recovery.');
    }
  };

  const handleCompleteAccountRecovery = async (approved: boolean) => {
    try {
      const result = await completeAccountRecovery(approved);
      setRecoveryStatus(result);
      toast.success(approved ? 'Account recovery approved.' : 'Account recovery rejected.');
    } catch (error) {
      console.error('Failed to complete account recovery', error);
      toast.error('Failed to complete account recovery.');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setWorkingSessionId(sessionId);
    try {
      await revokeLoginSession(sessionId);
      await refreshAll();
      toast.success('Session revoked.');
    } catch (error) {
      console.error('Failed to revoke session', error);
      toast.error('Failed to revoke session.');
    } finally {
      setWorkingSessionId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      await revokeOtherSessions();
      await refreshAll();
      toast.success('Other sessions revoked.');
    } catch (error) {
      console.error('Failed to revoke other sessions', error);
      toast.error('Failed to revoke other sessions.');
    }
  };

  const handleRegisterBrainwave = async () => {
    setRegisteringBrainwave(true);
    try {
      await registerBrainwaveDevice();
      setBrainwaveDevices(await getBrainwaveDevices());
      toast.success('Device registered.');
    } catch (error) {
      console.error('Failed to register device', error);
      toast.error('Failed to register device.');
    } finally {
      setRegisteringBrainwave(false);
    }
  };

  const handleRemoveBrainwave = async (deviceId: string) => {
    try {
      await removeBrainwaveDevice(deviceId);
      setBrainwaveDevices((devices) => devices.filter((device) => device.id !== deviceId));
      toast.success('Device removed.');
    } catch (error) {
      console.error('Failed to remove device', error);
      toast.error('Failed to remove device.');
    }
  };

  const handleMarkAlertRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      await fetchNotifications();
      toast.success('Alert marked as read.');
    } catch (error) {
      console.error('Failed to mark alert as read', error);
      toast.error('Failed to mark alert as read.');
    }
  };

  const handleResolveSecurityAlert = async (alertId: string) => {
    try {
      const updated = await resolveSecurityAlert(alertId);
      setSecurityAlerts((alerts) => alerts.map((alert) => alert.id === updated.id ? updated : alert));
      toast.success('Security alert resolved.');
    } catch (error) {
      console.error('Failed to resolve security alert', error);
      toast.error('Failed to resolve security alert.');
    }
  };

  const handleReopenSecurityAlert = async (alertId: string) => {
    try {
      const updated = await reopenSecurityAlert(alertId);
      setSecurityAlerts((alerts) => alerts.map((alert) => alert.id === updated.id ? updated : alert));
      toast.success('Security alert reopened.');
    } catch (error) {
      console.error('Failed to reopen security alert', error);
      toast.error('Failed to reopen security alert.');
    }
  };

  return (
    <PageShell
      eyebrow="Security"
      title="Security Checkup"
      description="Review recent login alerts, suspicious devices, and active sessions before they become a problem."
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={refreshAll} disabled={refreshing} icon={<RefreshCw size={16} />}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Link to="/security-logs">
            <Button variant="secondary">Security Logs</Button>
          </Link>
          <Button variant="primary" onClick={handleRevokeOtherSessions} icon={<ShieldAlert size={16} />}>
            Revoke Others
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-5">
          <StatCard
            icon={<Clock3 size={18} />}
            label="Active sessions"
            value={sessions.length}
            description={currentSession ? 'Current device is included.' : 'No current session detected.'}
          />
          <StatCard
            icon={<ShieldAlert size={18} />}
            label="Pending approvals"
            value={pendingSessions.length}
            description="New sessions waiting for your review."
          />
          <StatCard
            icon={<AlertTriangle size={18} />}
            label="Suspicious sessions"
            value={suspiciousSessions.length}
            description="Devices flagged by the backend risk check."
          />
          <StatCard
            icon={<BellRing size={18} />}
            label="Unread login alerts"
            value={unreadCount}
            description="Alerts also appear in your notification feed."
          />
          <StatCard
            icon={<Brain size={18} />}
            label="Neural devices"
            value={brainwaveDevices.length}
            description="Registered brainwave authentication devices."
          />
        </div>

        <section className="rounded-2xl border border-dark-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-lg text-dark-900 dark:text-white">Account recovery</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                {recoveryStatus ? `Current status: ${recoveryStatus.status} via ${recoveryStatus.method}` : 'No active account recovery request.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={handleStartAccountRecovery}>Start recovery</Button>
              <Button variant="primary" onClick={() => handleCompleteAccountRecovery(true)}>Approve recovery</Button>
              <Button variant="outline" onClick={() => handleCompleteAccountRecovery(false)}>Reject recovery</Button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4 rounded-2xl border border-dark-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-lg text-dark-900 dark:text-white">Recent Login Alerts</p>
                <p className="text-sm text-dark-500 dark:text-dark-400">
                  Real alerts generated by the auth service whenever a new session looks risky.
                </p>
              </div>
              {unreadCount > 0 && (
                <Button variant="secondary" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </div>

            {loginAlerts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-dark-200 bg-dark-50/80 p-6 text-sm text-dark-600 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-300">
                No login alerts yet. When the backend flags a new sign-in, it will show here and in the notification feed.
              </div>
            ) : (
              <div className="space-y-3">
                {loginAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-2xl border p-4 ${alert.read ? 'border-dark-200 bg-white dark:border-dark-700 dark:bg-dark-900/60' : 'border-primary-200 bg-primary-50/80 dark:border-primary-900/40 dark:bg-primary-950/30'}`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <ShieldCheck size={16} className="text-primary-600 dark:text-primary-300" />
                          <p className="font-medium text-dark-900 dark:text-white">
                            {alert.metadata?.suspicious ? 'Suspicious sign-in detected' : 'Login alert'}
                          </p>
                          {!alert.read && (
                            <span className="rounded-full bg-primary-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white">
                              Unread
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-dark-600 dark:text-dark-300">
                          {typeof alert.metadata?.deviceName === 'string' && alert.metadata.deviceName.trim()
                            ? alert.metadata.deviceName
                            : 'Unknown device'}
                          {typeof alert.metadata?.ipAddress === 'string' && alert.metadata.ipAddress.trim()
                            ? ` · ${alert.metadata.ipAddress}`
                            : ''}
                        </p>
                        <p className="text-xs text-dark-500 dark:text-dark-400">
                          {formatDateTime(alert.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link to="/notifications">
                          <Button variant="secondary">Open feed</Button>
                        </Link>
                        {!alert.read && (
                          <Button variant="primary" onClick={() => handleMarkAlertRead(alert.id)}>
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-dark-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
            <div>
              <p className="font-semibold text-lg text-dark-900 dark:text-white">Persisted security alerts</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">Alerts remain available after a server restart until you resolve them.</p>
            </div>
            {securityAlerts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-dark-200 p-4 text-sm text-dark-600 dark:border-dark-700 dark:text-dark-300">No suspicious login alerts recorded.</p>
            ) : (
              <div className="space-y-3">
                {securityAlerts.map((alert) => (
                  <div key={alert.id} className={`rounded-xl border p-4 ${alert.resolved ? 'border-dark-200 bg-dark-50 dark:border-dark-700 dark:bg-dark-900/40' : 'border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/20'}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-dark-900 dark:text-white">{alert.message}</p>
                          <span className="rounded-full bg-dark-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-dark-700 dark:bg-dark-800 dark:text-dark-300">{alert.severity}</span>
                          <span className="text-xs text-dark-500 dark:text-dark-400">{alert.resolved ? 'Resolved' : 'Needs review'}</span>
                        </div>
                        <p className="mt-1 text-xs text-dark-500 dark:text-dark-400">{formatDateTime(alert.createdAt)}</p>
                      </div>
                      <Button variant={alert.resolved ? 'secondary' : 'primary'} onClick={() => alert.resolved ? handleReopenSecurityAlert(alert.id) : handleResolveSecurityAlert(alert.id)}>
                        {alert.resolved ? 'Reopen' : 'Resolve'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-dark-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
            <div>
              <p className="font-semibold text-lg text-dark-900 dark:text-white">Security status</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                The server already persists session state, approval status, and suspicious-device flags.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-dark-200 bg-dark-50/70 p-4 dark:border-dark-700 dark:bg-dark-900/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <Smartphone size={16} />
                Current session
              </div>
              {currentSession ? (
                <>
                  <p className="text-sm text-dark-600 dark:text-dark-300">{getSessionLabel(currentSession)}</p>
                  <p className="text-xs text-dark-500 dark:text-dark-400">
                    {currentSession.ipAddress || 'Unknown IP'} · Last seen{' '}
                    {currentSession.lastSeenAt ? formatDateTime(currentSession.lastSeenAt) : 'just now'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-dark-600 dark:text-dark-300">No active session is currently marked by the API.</p>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-dark-200 bg-dark-50/70 p-4 dark:border-dark-700 dark:bg-dark-900/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <UserCheck size={16} />
                Pending approvals
              </div>
              {pendingSessions.length === 0 ? (
                <p className="text-sm text-dark-600 dark:text-dark-300">No sessions are waiting for approval.</p>
              ) : (
                <div className="space-y-2">
                  {pendingSessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="rounded-xl border border-dark-200 bg-white p-3 dark:border-dark-700 dark:bg-dark-900">
                      <p className="text-sm font-medium text-dark-900 dark:text-white">{getSessionLabel(session)}</p>
                      <p className="text-xs text-dark-500 dark:text-dark-400">
                        {session.ipAddress || 'Unknown IP'} · {formatDateTime(session.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-primary-200 bg-primary-50/80 p-4 text-sm text-primary-950 dark:border-primary-900/50 dark:bg-primary-950/30 dark:text-primary-100">
              Login alerts are driven by real backend notifications, so approving or revoking sessions here updates the actual auth state.
            </div>
          </section>
        </div>

        <section className="space-y-4 rounded-2xl border border-dark-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-semibold text-lg text-dark-900 dark:text-white">All sessions</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                Review every signed-in device, approve new access, or revoke anything you do not recognize.
              </p>
            </div>
            <Link to="/notifications">
              <Button variant="secondary">View notifications</Button>
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-dark-500 dark:text-dark-400">Loading session data...</p>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-dark-200 bg-dark-50/80 p-6 text-sm text-dark-600 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-300">
              No sessions were returned by the API.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const canApprove = !session.isApproved && !session.isRevoked;
                const statusLabel = session.isCurrent
                  ? 'Current'
                  : session.isRevoked
                    ? 'Revoked'
                    : session.isApproved
                      ? 'Approved'
                      : session.suspicious
                        ? 'Pending approval'
                        : 'Active';

                return (
                  <div key={session.id} className="flex flex-col gap-4 rounded-2xl border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-900/70 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-dark-900 dark:text-white">{getSessionLabel(session)}</p>
                        <span className="rounded-full bg-dark-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-dark-700 dark:bg-dark-800 dark:text-dark-300">
                          {statusLabel}
                        </span>
                        {session.isTrusted && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            Trusted
                          </span>
                        )}
                        {session.suspicious && !session.isApproved && !session.isRevoked && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            Needs review
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-dark-600 dark:text-dark-300">
                        {session.ipAddress || 'Unknown IP'} · Started {formatDateTime(session.createdAt)}
                      </p>
                      <p className="text-xs text-dark-500 dark:text-dark-400">
                        Last seen {session.lastSeenAt ? formatDateTime(session.lastSeenAt) : 'just now'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {canApprove && (
                        <Button
                          variant="secondary"
                          onClick={() => handleApproveSession(session.id)}
                          disabled={workingSessionId === session.id}
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={session.isCurrent || session.isRevoked || workingSessionId === session.id}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-dark-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold text-lg text-dark-900 dark:text-white">Registered Devices</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                Review and remove devices registered for neural authentication.
              </p>
            </div>
            <Button variant="secondary" onClick={handleRegisterBrainwave} disabled={registeringBrainwave} icon={<Plus size={16} />}>
              {registeringBrainwave ? 'Registering...' : 'Register Device'}
            </Button>
          </div>
          {brainwaveDevices.length === 0 ? (
            <p className="text-sm text-dark-500 dark:text-dark-400">No registered devices.</p>
          ) : (
            <div className="space-y-3">
              {brainwaveDevices.map((device) => (
                <div key={device.id} className="flex flex-col gap-3 rounded-xl border border-dark-200 p-4 dark:border-dark-700 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-dark-900 dark:text-white">{device.deviceModel}</p>
                    <p className="text-xs text-dark-500 dark:text-dark-400">
                      Firmware: {device.firmware} · Registered {formatDateTime(device.registeredAt)}
                    </p>
                  </div>
                  <Button variant="destructive" onClick={() => handleRemoveBrainwave(device.id)} icon={<Trash2 size={16} />}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
        
        {/* Biometric sign-in */}
        <section className="space-y-4 rounded-2xl border border-dark-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <div className="flex items-start gap-4">
            <div>
              <p className="font-semibold text-lg text-dark-900 dark:text-white flex items-center gap-2">
                Biometric Sign-in
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Available</span>
              </p>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                Sign in with Face ID, Touch ID, or Windows Hello using a passkey registered to this device. Go to the
                Login page and choose <span className="font-medium">Passkey &rarr; Face ID / Fingerprint</span>.
              </p>
              <div className="mt-3">
                <Link
                  to="/passkeys"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                >
                  Manage your passkeys
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dark-200 bg-white/90 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-dark-500 dark:text-dark-400">{label}</p>
          <p className="mt-1 text-3xl font-semibold text-dark-900 dark:text-white">{value}</p>
        </div>
        <div className="rounded-2xl bg-primary-50 p-2 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-xs text-dark-500 dark:text-dark-400">{description}</p>
    </div>
  );
}

export default SecurityCheckupPage;