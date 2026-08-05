import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../hooks/useToast';
import {
  listWebhookEndpoints,
  createWebhookEndpoint,
  updateWebhookEndpoint,
  deleteWebhookEndpoint,
  rotateWebhookSecret,
  getWebhookDeliveries,
} from '../lib/api';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Plus, Trash2, RefreshCw, Copy, ListRestart } from 'lucide-react';

const WEBHOOK_EVENTS = [
  'post.created',
  'post.updated',
  'post.deleted',
  'user.updated',
  'follow.created',
  'reaction.created',
  'comment.created',
  'payment.payout_completed',
];

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  secret?: string;
}

interface WebhookDelivery {
  id: string;
  event: string;
  status: string;
  retries: number;
  lastError: string | null;
  createdAt: string;
}

export const WebhooksPage = () => {
  const { addToast } = useToast();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['post.created']);
  const [isSaving, setIsSaving] = useState(false);
  const [deliveries, setDeliveries] = useState<Record<string, WebhookDelivery[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchEndpoints = useCallback(async () => {
    try {
      const data = await listWebhookEndpoints();
      setEndpoints(Array.isArray(data) ? data : []);
    } catch {
      setEndpoints([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    addToast('Copied to clipboard', 'success');
  };

  const toggleEvent = (event: string) => {
    setEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  const handleCreate = async () => {
    if (!url.trim() || events.length === 0) {
      addToast('URL and at least one event are required', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const created = await createWebhookEndpoint({ url: url.trim(), events });
      setEndpoints((prev) => [created, ...prev]);
      setUrl('');
      setEvents(['post.created']);
      setShowCreate(false);
      if (created.secret) {
        setTimeout(() => copy(created.secret), 0);
      }
      addToast('Webhook endpoint created — signing secret copied', 'success');
    } catch (error: any) {
      addToast(error?.response?.data?.message || 'Failed to create endpoint', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (endpoint: WebhookEndpoint) => {
    try {
      await updateWebhookEndpoint(endpoint.id, { active: !endpoint.active });
      setEndpoints((prev) =>
        prev.map((e) => (e.id === endpoint.id ? { ...e, active: !e.active } : e)),
      );
      addToast(endpoint.active ? 'Endpoint paused' : 'Endpoint active', 'success');
    } catch {
      addToast('Failed to update endpoint', 'error');
    }
  };

  const handleRotate = async (endpointId: string) => {
    try {
      const result = await rotateWebhookSecret(endpointId);
      setEndpoints((prev) =>
        prev.map((e) => (e.id === endpointId ? { ...e, secret: result.secret } : e)),
      );
      setTimeout(() => copy(result.secret), 0);
      addToast('New signing secret generated — copied', 'success');
    } catch {
      addToast('Failed to rotate secret', 'error');
    }
  };

  const handleDelete = async (endpointId: string) => {
    try {
      await deleteWebhookEndpoint(endpointId);
      setEndpoints((prev) => prev.filter((e) => e.id !== endpointId));
      addToast('Endpoint deleted', 'success');
    } catch {
      addToast('Failed to delete endpoint', 'error');
    }
  };

  const toggleDeliveries = async (endpointId: string) => {
    const isOpen = expanded === endpointId;
    setExpanded(isOpen ? null : endpointId);
    if (!isOpen && !deliveries[endpointId]) {
      try {
        const data = await getWebhookDeliveries(endpointId);
        setDeliveries((prev) => ({ ...prev, [endpointId]: data }));
      } catch {
        setDeliveries((prev) => ({ ...prev, [endpointId]: [] }));
      }
    }
  };

  return (
    <PageShell
      eyebrow="Developer"
      title="Webhooks"
      description="Deliver Zynkra events to your own servers with HMAC-signed payloads."
    >
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreate((v) => !v)}>
          <Plus className="w-4 h-4 mr-2" /> New endpoint
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Create a webhook endpoint</h3>
            <Input
              placeholder="https://your-server.com/hooks"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Events</p>
              <div className="flex flex-wrap gap-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <button
                    key={event}
                    type="button"
                    onClick={() => toggleEvent(event)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      events.includes(event)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {event}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={isSaving}>
                {isSaving ? 'Creating…' : 'Create'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading
          ? [...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))
          : endpoints.map((endpoint) => (
              <Card key={endpoint.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{endpoint.url}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {endpoint.events.map((event) => (
                          <span
                            key={event}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {endpoint.active ? 'Active' : 'Paused'} · created{' '}
                        {new Date(endpoint.createdAt).toLocaleDateString()}
                      </p>
                      {endpoint.secret && (
                        <div className="mt-2 flex items-center gap-2">
                          <code className="rounded bg-gray-100 px-2 py-1 text-xs break-all">
                            {endpoint.secret}
                          </code>
                          <Button variant="outline" size="sm" onClick={() => copy(endpoint.secret!)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleToggleActive(endpoint)}>
                        {endpoint.active ? 'Pause' : 'Resume'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleRotate(endpoint.id)}>
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(endpoint.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Button variant="ghost" size="sm" onClick={() => toggleDeliveries(endpoint.id)}>
                      <ListRestart className="w-3 h-3 mr-1" /> Deliveries
                    </Button>
                    {expanded === endpoint.id && (
                      <div className="mt-2 space-y-1">
                        {(deliveries[endpoint.id] || []).length === 0 ? (
                          <p className="text-sm text-muted-foreground">No deliveries yet.</p>
                        ) : (
                          deliveries[endpoint.id].map((d) => (
                            <div
                              key={d.id}
                              className="flex items-center justify-between rounded border p-2 text-sm"
                            >
                              <span>
                                <span className="font-medium">{d.event}</span>{' '}
                                <span className="text-muted-foreground">
                                  {new Date(d.createdAt).toLocaleString()}
                                </span>
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                  d.status === 'delivered'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {d.status}
                                {d.status === 'failed' && d.retries > 0 ? ` (${d.retries} retries)` : ''}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </PageShell>
  );
};
