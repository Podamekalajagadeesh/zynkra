import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronRight,
  MapPin,
  MapPinned,
  Calendar,
  Clock,
  AlertTriangle,
  Shield,
  Share2,
  ExternalLink,
  RefreshCw,
  Phone,
  Globe,
  Info,
} from 'lucide-react';
import { api } from '../../lib/api';
import { PageShell } from '../../components/PageShell';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import SafetyCheck from '../../components/crisis/SafetyCheck';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type Severity = 'low' | 'medium' | 'high' | 'critical';
type EventStatus = 'active' | 'monitoring' | 'resolved';

interface CrisisUpdate {
  id: string;
  message: string;
  author?: string;
  timestamp: string;
  type: 'update' | 'alert' | 'resolution' | 'info';
}

interface CrisisEventDetail {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  status: EventStatus;
  location: string;
  affectedArea: string;
  eventType: string;
  createdAt: string;
  updatedAt: string;
  updates: CrisisUpdate[];
  resources: { label: string; url: string }[];
  safetyCheckIns: number;
  contactInfo?: string;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const SEVERITY_CONFIG: Record<Severity, { label: string; bg: string; color: string; border: string }> = {
  low: { label: 'Low', bg: 'bg-emerald-100 dark:bg-emerald-900/40', color: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  medium: { label: 'Medium', bg: 'bg-amber-100 dark:bg-amber-900/40', color: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  high: { label: 'High', bg: 'bg-orange-100 dark:bg-orange-900/40', color: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  critical: { label: 'Critical', bg: 'bg-red-100 dark:bg-red-900/40', color: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
};

const STATUS_CONFIG: Record<EventStatus, { label: string; bg: string; color: string; dot: string }> = {
  active: { label: 'Active', bg: 'bg-red-100 dark:bg-red-900/40', color: 'text-red-700 dark:text-red-300', dot: 'bg-red-500 animate-pulse' },
  monitoring: { label: 'Monitoring', bg: 'bg-amber-100 dark:bg-amber-900/40', color: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-100 dark:bg-emerald-900/40', color: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
};

const UPDATE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  update: { icon: <Info className="h-4 w-4" />, color: 'text-blue-600 dark:text-blue-400' },
  alert: { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-600 dark:text-red-400' },
  resolution: { icon: <Shield className="h-4 w-4" />, color: 'text-emerald-600 dark:text-emerald-400' },
  info: { icon: <Info className="h-4 w-4" />, color: 'text-dark-500 dark:text-dark-400' },
};

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton width={280} height={28} />
      <div className="flex gap-2">
        <Skeleton width={90} height={26} className="rounded-full" />
        <Skeleton width={100} height={26} className="rounded-full" />
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton width="100%" height={16} />
          <Skeleton width="90%" height={16} />
          <Skeleton width="60%" height={16} />
          <div className="flex gap-4 pt-2">
            <Skeleton width={160} height={14} />
            <Skeleton width={140} height={14} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton width={180} height={20} />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton width={32} height={32} className="rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton width="80%" height={14} />
                <Skeleton width="40%" height={12} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Error / Empty                                                             */
/* -------------------------------------------------------------------------- */

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/40">
        <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-1">
        Could not load event details
      </h3>
      <p className="text-sm text-dark-500 dark:text-dark-400 mb-4 max-w-xs">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" />}>
        Try again
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Detail page                                                               */
/* -------------------------------------------------------------------------- */

const CrisisEventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<CrisisEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/crisis-events/${id}`);
      setEvent(response.data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load crisis event details.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  /* ---- Share / alert ------------------------------------------------------ */

  const handleShare = async () => {
    if (!event) return;
    const shareData = {
      title: `Crisis Alert: ${event.name}`,
      text: `Crisis Alert - ${event.severity.toUpperCase()} severity: ${event.name}. Location: ${event.location}. Stay safe.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(
        `${shareData.title}\n${shareData.text}\n${shareData.url}`,
      );
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  /* ---- Helpers ------------------------------------------------------------ */

  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /* ---- Render states ------------------------------------------------------ */

  if (loading) {
    return (
      <PageShell>
        <DetailSkeleton />
      </PageShell>
    );
  }

  if (error || !event) {
    return (
      <PageShell>
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-dark-500 dark:text-dark-400" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/crisis-events" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Crisis Events</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-dark-900 dark:text-white">Details</span>
        </nav>
        <ErrorState message={error || 'Event not found.'} onRetry={fetchEvent} />
      </PageShell>
    );
  }

  const severityCfg = SEVERITY_CONFIG[event.severity] ?? SEVERITY_CONFIG.low;
  const statusCfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.active;

  return (
    <PageShell>
      {/* ---- Breadcrumbs ---- */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-dark-500 dark:text-dark-400" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/crisis-events" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Crisis Events</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-dark-900 dark:text-white truncate max-w-[200px]">{event.name}</span>
      </nav>

      <div className="space-y-6">
        {/* ---- Header ---- */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-dark-900 dark:text-white mb-3">
            {event.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${severityCfg.bg} ${severityCfg.color}`}>
              {event.severity === 'critical' && <AlertTriangle className="h-3.5 w-3.5" />}
              {severityCfg.label} Severity
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
              <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            {event.eventType && (
              <Badge variant="secondary">{event.eventType}</Badge>
            )}
          </div>
        </div>

        {/* ---- Quick actions ---- */}
        <div className="flex flex-wrap gap-2">
          <Button asChild icon={<Shield className="h-4 w-4" />}>
            <Link to={`/crisis-events/${event.id}/safety-check`}>
              Mark Me Safe
            </Link>
          </Button>
          <Button variant="outline" onClick={handleShare} icon={<Share2 className="h-4 w-4" />}>
            {shareStatus === 'copied' ? 'Link Copied!' : 'Share / Alert Friends'}
          </Button>
          <Button variant="ghost" onClick={fetchEvent} icon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
        </div>

        {/* ---- Main details ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: description + details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {event.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-dark-700 dark:text-dark-300 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Timeline of updates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Updates & Actions Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {event.updates && event.updates.length > 0 ? (
                  <div className="relative ml-3 border-l-2 border-dark-200 dark:border-dark-700 space-y-6">
                    {event.updates.map((update, idx) => {
                      const typeCfg = UPDATE_TYPE_CONFIG[update.type] ?? UPDATE_TYPE_CONFIG.info;
                      return (
                        <div key={update.id || idx} className="relative pl-6">
                          <div className={`absolute -left-[1.35rem] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white dark:border-dark-800 dark:bg-dark-800 ${typeCfg.color}`}>
                            {typeCfg.icon}
                          </div>
                          <p className="text-sm text-dark-800 dark:text-dark-200 leading-relaxed">
                            {update.message}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-dark-500 dark:text-dark-400">
                            {update.author && <span>{update.author}</span>}
                            <span title={formatDate(update.timestamp)}>
                              {formatRelativeTime(update.timestamp)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-dark-500 dark:text-dark-400">
                    No updates posted yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: sidebar info */}
          <div className="space-y-6">
            {/* Key details card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-dark-400 shrink-0" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-dark-500 dark:text-dark-400 font-medium">Location</p>
                    <p className="text-sm font-medium text-dark-900 dark:text-white">{event.location || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPinned className="h-4 w-4 mt-0.5 text-dark-400 shrink-0" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-dark-500 dark:text-dark-400 font-medium">Affected Area</p>
                    <p className="text-sm font-medium text-dark-900 dark:text-white">{event.affectedArea || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-dark-400 shrink-0" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-dark-500 dark:text-dark-400 font-medium">Created</p>
                    <p className="text-sm font-medium text-dark-900 dark:text-white">{formatDate(event.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 mt-0.5 text-dark-400 shrink-0" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-dark-500 dark:text-dark-400 font-medium">Last Updated</p>
                    <p className="text-sm font-medium text-dark-900 dark:text-white">{formatDate(event.updatedAt)}</p>
                  </div>
                </div>
                {event.safetyCheckIns > 0 && (
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 mt-0.5 text-dark-400 shrink-0" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-dark-500 dark:text-dark-400 font-medium">Safety Check-ins</p>
                      <p className="text-sm font-medium text-dark-900 dark:text-white">{event.safetyCheckIns.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {event.contactInfo && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 mt-0.5 text-dark-400 shrink-0" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-dark-500 dark:text-dark-400 font-medium">Emergency Contact</p>
                      <p className="text-sm font-medium text-dark-900 dark:text-white">{event.contactInfo}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related resources */}
            {event.resources && event.resources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resources & Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {event.resources.map((resource, idx) => (
                    <a
                      key={idx}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/30 transition-colors"
                    >
                      <Globe className="h-4 w-4 shrink-0" />
                      <span className="truncate">{resource.label}</span>
                      <ExternalLink className="h-3 w-3 ml-auto shrink-0 opacity-50" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Safety check-in integration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Safety Check-In</CardTitle>
              </CardHeader>
              <CardContent>
                <SafetyCheck
                  crisisEventId={event.id}
                  friends={[]}
                  userId=""
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default CrisisEventDetailPage;
