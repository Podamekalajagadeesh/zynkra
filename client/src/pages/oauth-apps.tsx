import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../hooks/useToast';
import {
  createOAuthApp,
  listOAuthApps,
  deleteOAuthApp,
  rotateOAuthSecret,
} from '../lib/api';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Skeleton } from '../components/ui/skeleton';
import { KeyRound, Plus, Trash2, RefreshCw, Copy } from 'lucide-react';

interface OAuthApp {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  redirectUris: string[];
  scopes: string[];
  homepageUrl: string | null;
  clientSecret?: string;
}

export const OAuthAppsPage = () => {
  const { addToast } = useToast();
  const [apps, setApps] = useState<OAuthApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [redirectUris, setRedirectUris] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchApps = useCallback(async () => {
    try {
      const data = await listOAuthApps();
      setApps(Array.isArray(data) ? data : []);
    } catch {
      setApps([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    addToast('Copied to clipboard', 'success');
  };

  const handleCreate = async () => {
    if (!name.trim() || !redirectUris.trim()) {
      addToast('Name and redirect URIs are required', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const created = await createOAuthApp({
        name: name.trim(),
        description: description || undefined,
        redirectUris: redirectUris
          .split(/[\n,]/)
          .map((u) => u.trim())
          .filter(Boolean),
      });
      setApps((prev) => [created, ...prev]);
      setShowCreate(false);
      setName('');
      setDescription('');
      setRedirectUris('');
      addToast('App created — save the client secret now', 'success');
    } catch (error: any) {
      addToast(error?.response?.data?.message || 'Failed to create app', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRotate = async (appId: string) => {
    try {
      const result = await rotateOAuthSecret(appId);
      setApps((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, clientSecret: result.clientSecret } : app)),
      );
      addToast('New secret generated — copy it now', 'success');
    } catch {
      addToast('Failed to rotate secret', 'error');
    }
  };

  const handleDelete = async (appId: string) => {
    try {
      await deleteOAuthApp(appId);
      setApps((prev) => prev.filter((app) => app.id !== appId));
      addToast('App deleted', 'success');
    } catch {
      addToast('Failed to delete app', 'error');
    }
  };

  return (
    <PageShell
      eyebrow="Developer"
      title="OAuth Apps"
      description="Register applications that can access Zynkra on your behalf."
    >
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreate((v) => !v)}>
          <Plus className="w-4 h-4 mr-2" /> New app
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Register an app</h3>
            <Input placeholder="App name" value={name} onChange={(e) => setName(e.target.value)} />
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Textarea
              placeholder="Redirect URIs (one per line)"
              value={redirectUris}
              onChange={(e) => setRedirectUris(e.target.value)}
            />
            <Button onClick={handleCreate} disabled={isSaving} className="w-full">
              Create app
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton height={80} />
          <Skeleton height={80} />
        </div>
      ) : apps.length === 0 ? (
        <div className="py-12 text-center text-dark-500">
          <KeyRound className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No OAuth apps yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{app.name}</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleRotate(app.id)}>
                      <RefreshCw className="w-4 h-4 mr-1" /> Rotate secret
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(app.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                {app.description && (
                  <p className="text-sm text-dark-500">{app.description}</p>
                )}
                <div className="text-sm flex items-center gap-2">
                  <span className="text-dark-500">Client ID:</span>
                  <code className="text-xs bg-dark-100 dark:bg-dark-800 px-2 py-0.5 rounded">{app.clientId}</code>
                  <button onClick={() => copy(app.clientId)} aria-label="Copy client ID">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                {app.clientSecret && (
                  <div className="text-sm flex items-center gap-2">
                    <span className="text-dark-500">Client secret:</span>
                    <code className="text-xs bg-dark-100 dark:bg-dark-800 px-2 py-0.5 rounded break-all">
                      {app.clientSecret}
                    </code>
                    <button onClick={() => copy(app.clientSecret)} aria-label="Copy client secret">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="text-xs text-dark-400">
                  Scopes: {app.scopes.join(', ')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
};
