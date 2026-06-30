
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
  getLoginSessions,
  getPendingLoginSessions,
  revokeLoginSession,
  revokeOtherSessions,
  type LoginSession,
  getBrainwaveDevices,
  registerBrainwaveDevice,
  removeBrainwaveDevice,
} from '../lib/api';
import { formatDateTime } from '../lib/preferences';
import { useNotifications } from '../providers/notifications-provider';

type LoginAlertMetadata = {
  sessionId?: string;
  deviceName?: string | null;
  ipAddress?: string | null;
  suspicious?: boolean;
};

type SecurityNotification = {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  metadata: LoginAlertMetadata | null;
};

function getSessionLabel(session: LoginSession) {
  return session.deviceName || session.userAgent || 'Unknown device';
}

export function SecurityCheckupPage() {
  const { activeAccount } = useAuth();
  const notificationsApi = useNotifications() as {
    notifications: SecurityNotification[];
    unreadCount: number;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    fetchNotifications: () => Promise<void>;
  };
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = notificationsApi;
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [pendingSessions, setPendingSessions] = useState<LoginSession[]>([]);
  const [brainwaveDevices, setBrainwaveDevices] = useState<any[]>([]);
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
      const [allSessions, pending, brainwaveDevicesData] = await Promise.all([
        getLoginSessions(), 
        getPendingLoginSessions(),
        getBrainwaveDevices()
      ]);
      setSessions(allSessions);
      setPendingSessions(pending);
      setBrainwaveDevices(brainwaveDevicesData);
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
                          {alert.metadata?.deviceName || 'Unknown device'}
                          {alert.metadata?.ipAddress ? ` · ${alert.metadata.ipAddress}` : ''}
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
        
        {/* Brainwave Authentication Devices Section */}
        <section className="space-y-4 rounded-2xl border border-dark-200 bg-white/90 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-lg text-dark-900 dark:text-white">Neural Authentication Devices</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                Manage your registered brainwave authentication devices. Your unique neural signature is encrypted and never stored in plaintext.
              </p>
            </div>
            <Button 
              variant="primary" 
              size="sm" 
              disabled={registeringBrainwave}
              onClick={async () => {
                setRegisteringBrainwave(true);
                try {
                  await registerBrainwaveDevice();
                  await loadSecurityData();
                  toast.success('New brainwave device registered successfully!');
                } catch (error) {
                  console.error('Failed to register brainwave device', error);
                  toast.error('Failed to register new neural device.');
                } finally {
                  setRegisteringBrainwave(false);
                }
              }}
              icon={<Plus size={16} />}
            >
              {registeringBrainwave ? 'Registering...' : 'Add New Device'}
            </Button>
          </div>
          
          {brainwaveDevices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Brain className="w-12 h-12 text-dark-300 dark:text-dark-600 mb-4" />
              <p className="text-dark-500 dark:text-dark-400">No neural authentication devices registered yet.</p>
              <p className="text-sm text-dark-400 dark:text-dark-500 mt-1">Add your first brainwave headset to enable unhackable neural authentication.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {brainwaveDevices.map((device) => (
                <Card key={device.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary-50 p-2 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
                        <Brain size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-dark-900 dark:text-white">{device.deviceModel}</p>
                        <p className="text-sm text-dark-500 dark:text-dark-400">
                          Registered on {new Date(device.registeredAt).toLocaleDateString()} • Firmware {device.firmware}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        try {
                          await removeBrainwaveDevice(device.id);
                          await loadSecurityData();
                          toast.success('Neural device removed successfully.');
                        } catch (error) {
                          console.error('Failed to remove brainwave device', error);
                          toast.error('Failed to remove neural device.');
                        }
                      }}
                      icon={<Trash2 size={16} />}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-dark-500 dark:text-dark-400">
                      Neural signature verified • Authentication accuracy: {device.accuracy.toFixed(1)}%
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
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