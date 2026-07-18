import { useState, useEffect } from 'react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Plus, Trash2, Check, X, ExternalLink } from 'lucide-react';
import { getConnectedAccounts, connectAccount, disconnectAccount } from '../lib/api';

type SocialPlatform = 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok';

type ConnectedAccount = {
  id: string;
  platform: SocialPlatform;
  platformUsername: string;
  platformUserId: string;
  isActive: boolean;
  connectedAt: string;
};

type ConnectAccountForm = {
  platform: SocialPlatform;
  apiKey: string;
  apiSecret: string;
  accessToken: string;
};

const platformLabels: Record<SocialPlatform, string> = {
  twitter: 'X (Twitter)',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok'
};

const platformColors: Record<SocialPlatform, string> = {
  twitter: 'bg-sky-500',
  instagram: 'bg-pink-500',
  facebook: 'bg-blue-600',
  linkedin: 'bg-blue-700',
  tiktok: 'bg-gray-900'
};

const platformIcons: Record<SocialPlatform, string> = {
  twitter: '𝕏',
  instagram: '📷',
  facebook: 'f',
  linkedin: 'in',
  tiktok: '♪'
};

const ConnectedAccountsPage = () => {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [newAccount, setNewAccount] = useState<ConnectAccountForm>({
    platform: 'twitter',
    apiKey: '',
    apiSecret: '',
    accessToken: ''
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await getConnectedAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to load connected accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    try {
      const account = await connectAccount(newAccount);
      setAccounts(prev => [...prev, account]);
      setIsConnectDialogOpen(false);
      setNewAccount({ platform: 'twitter', apiKey: '', apiSecret: '', accessToken: '' });
    } catch (error) {
      console.error('Failed to connect account:', error);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      await disconnectAccount(accountId);
      setAccounts(prev => prev.filter(a => a.id !== accountId));
    } catch (error) {
      console.error('Failed to disconnect account:', error);
    }
  };

  const handleToggleAccountActive = async (accountId: string, isActive: boolean) => {
    try {
      setAccounts(prev => prev.map(a => 
        a.id === accountId ? { ...a, isActive } : a
      ));
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  if (loading) return <PageShell><p>Loading connected accounts...</p></PageShell>;

  return (
    <PageShell title="Connected Social Accounts">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cross-Platform Publishing</h1>
            <p className="text-gray-500 mt-1">
              Connect your external social media accounts to publish the same content across multiple platforms simultaneously.
            </p>
          </div>
          <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Connect New Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Connect Social Media Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleConnectAccount} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <select
                    id="platform"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newAccount.platform}
                    onChange={(e) => setNewAccount({...newAccount, platform: e.target.value as SocialPlatform})}
                  >
                    {Object.entries(platformLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="apiKey">API Key / App ID</Label>
                  <Input
                    id="apiKey"
                    value={newAccount.apiKey}
                    onChange={(e) => setNewAccount({...newAccount, apiKey: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="apiSecret">API Secret / App Secret</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={newAccount.apiSecret}
                    onChange={(e) => setNewAccount({...newAccount, apiSecret: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    value={newAccount.accessToken}
                    onChange={(e) => setNewAccount({...newAccount, accessToken: e.target.value})}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setIsConnectDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={connecting}>
                    {connecting ? 'Connecting...' : 'Connect Account'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {accounts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <ExternalLink className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold">No accounts connected</h3>
                <p className="text-gray-500 mt-2">Connect your first social media account to start cross-platform publishing.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map(account => (
              <Card key={account.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${platformColors[account.platform]} w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                        {platformIcons[account.platform]}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{platformLabels[account.platform]}</CardTitle>
                        <p className="text-sm text-gray-500">@{account.platformUsername}</p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisconnectAccount(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`active-${account.id}`}
                        checked={account.isActive}
                        onCheckedChange={(checked) => handleToggleAccountActive(account.id, checked)}
                      />
                      <Label htmlFor={`active-${account.id}`}>
                        {account.isActive ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <Check className="h-4 w-4" /> Active for publishing
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-500">
                            <X className="h-4 w-4" /> Paused
                          </span>
                        )}
                      </Label>
                    </div>
                    <p className="text-xs text-gray-400">
                      Connected {new Date(account.connectedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>How Cross-Platform Publishing Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Connect all your social media accounts from the major platforms</li>
              <li>When creating or scheduling a post, select which connected platforms you want to publish to</li>
              <li>Zynkra automatically publishes your content to all selected platforms simultaneously</li>
              <li>Track performance across all platforms from your Zynkra analytics dashboard</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
};

export default ConnectedAccountsPage;