import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Shield,
  Eye,
  MapPinned,
  Filter,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { EmptyState } from '../ui/empty-state';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type Severity = 'low' | 'medium' | 'high' | 'critical';
type EventStatus = 'active' | 'monitoring' | 'resolved';

interface CrisisEvent {
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
  safetyCheckIns?: number;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300' },
  medium: { label: 'Medium', color: 'text-amber-700', bg: 'bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300' },
  high: { label: 'High', color: 'text-orange-700', bg: 'bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300' },
  critical: { label: 'Critical', color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/40 dark:text-red-300' },
};

const STATUS_CONFIG: Record<EventStatus, { label: string; dot: string }> = {
  active: { label: 'Active', dot: 'bg-red-500' },
  monitoring: { label: 'Monitoring', dot: 'bg-amber-500' },
  resolved: { label: 'Resolved', dot: 'bg-emerald-500' },
};

const REFRESH_INTERVAL_MS = 60_000;

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="space-y-3">
            <Skeleton width={200} height={20} />
            <div className="flex gap-2">
              <Skeleton width={80} height={24} className="rounded-full" />
              <Skeleton width={100} height={24} className="rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton width="100%" height={14} />
            <Skeleton width="75%" height={14} />
            <div className="flex gap-4 pt-2">
              <Skeleton width={140} height={14} />
              <Skeleton width={120} height={14} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.low;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      {severity === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
      {cfg.label}
    </span>
  );
}

function StatusIndicator({ status }: { status: EventStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-dark-600 dark:text-dark-300">
      <span className={`w-2 h-2 rounded-full ${cfg.dot} ${status === 'active' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/40">
        <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-1">
        Failed to load crisis events
      </h3>
      <p className="text-sm text-dark-500 dark:text-dark-400 mb-4 max-w-xs">
        {message}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" />}>
        Try again
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

const CrisisEventsDashboard: React.FC = () => {
  const [events, setEvents] = useState<CrisisEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  /* ---- Fetch events ------------------------------------------------------- */

  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/crisis-events');
      setEvents(response.data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'An unexpected error occurred while fetching crisis events.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /* ---- Auto-refresh every 60s --------------------------------------------- */

  useEffect(() => {
    const interval = setInterval(fetchEvents, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  /* ---- Derived / filtered data --------------------------------------------- */

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        !searchQuery ||
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter;
      const matchesLocation =
        !locationFilter ||
        event.location?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        event.affectedArea?.toLowerCase().includes(locationFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesSeverity && matchesLocation;
    });
  }, [events, searchQuery, statusFilter, severityFilter, locationFilter]);

  const activeCount = events.filter((e) => e.status === 'active').length;
  const monitoringCount = events.filter((e) => e.status === 'monitoring').length;
  const criticalCount = events.filter((e) => e.severity === 'critical' && e.status !== 'resolved').length;

  const hasActiveFilters =
    statusFilter !== 'all' || severityFilter !== 'all' || locationFilter !== '';

  const clearFilters = () => {
    setStatusFilter('all');
    setSeverityFilter('all');
    setLocationFilter('');
  };

  /* ---- Render ------------------------------------------------------------- */

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchEvents} />;
  }

  return (
    <div className="space-y-6">
      {/* ---- Summary cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark-900 dark:text-white">{activeCount}</p>
              <p className="text-xs text-dark-500 dark:text-dark-400">Active Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
              <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark-900 dark:text-white">{monitoringCount}</p>
              <p className="text-xs text-dark-500 dark:text-dark-400">Monitoring</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40">
              <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark-900 dark:text-white">{criticalCount}</p>
              <p className="text-xs text-dark-500 dark:text-dark-400">Critical (Unresolved)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---- Search & filters ---- */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
            <Input
              placeholder="Search crisis events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter className="h-4 w-4" />}
          >
            Filters
            {hasActiveFilters && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
                !
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchEvents}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>

        {showFilters && (
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-dark-600 dark:text-dark-300">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as EventStatus | 'all')}
                  className="w-full rounded-xl border border-dark-200 bg-white px-3 py-2 text-sm dark:border-dark-700 dark:bg-dark-800 dark:text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-dark-600 dark:text-dark-300">Severity</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as Severity | 'all')}
                  className="w-full rounded-xl border border-dark-200 bg-white px-3 py-2 text-sm dark:border-dark-700 dark:bg-dark-800 dark:text-white"
                >
                  <option value="all">All Severities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-dark-600 dark:text-dark-300">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
                  <Input
                    placeholder="Filter by location..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex items-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters} icon={<X className="h-4 w-4" />}>
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* ---- Last refreshed ---- */}
      <p className="text-xs text-dark-400 dark:text-dark-500">
        Last updated {lastRefreshed.toLocaleTimeString()} -- auto-refreshes every 60 seconds
      </p>

      {/* ---- Empty state ---- */}
      {filteredEvents.length === 0 && !error && (
        <EmptyState
          icon={<Shield className="h-12 w-12" />}
          title={events.length === 0 ? 'No active crisis events' : 'No events match your filters'}
          description={
            events.length === 0
              ? 'There are currently no active crisis events in your area. Stay safe.'
              : 'Try adjusting your search or filters to find what you are looking for.'
          }
          action={
            hasActiveFilters
              ? { label: 'Clear Filters', onClick: clearFilters }
              : undefined
          }
        />
      )}

      {/* ---- Event cards grid ---- */}
      {filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <Link
              key={event.id}
              to={`/crisis-events/${event.id}`}
              className="group block"
            >
              <Card className="h-full transition-all duration-200 group-hover:shadow-lg group-hover:border-primary-300 dark:group-hover:border-primary-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {event.name}
                    </CardTitle>
                    <StatusIndicator status={event.status} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <SeverityBadge severity={event.severity} />
                    {event.eventType && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-dark-100 text-dark-600 dark:bg-dark-700 dark:text-dark-300">
                        {event.eventType}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {event.description && (
                    <p className="text-sm text-dark-600 dark:text-dark-400 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dark-500 dark:text-dark-400">
                    {event.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                    )}
                    {event.affectedArea && (
                      <span className="inline-flex items-center gap-1">
                        <MapPinned className="h-3 w-3" />
                        {event.affectedArea}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-dark-100 dark:border-dark-700">
                    <Button size="sm" variant="outline" className="flex-1" icon={<Shield className="h-3.5 w-3.5" />}>
                      Mark Safe
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1" icon={<Eye className="h-3.5 w-3.5" />}>
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CrisisEventsDashboard;
