import { useEffect, useState } from 'react';
import { Check, Link2, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import {
  getLinkedIdentityAccounts,
  setPrimaryIdentityAccount,
  startLinkedIdentityOAuth,
  unlinkIdentityAccount,
  LinkedIdentityAccount,
  LinkedIdentityProvider,
} from '../lib/api';

const providers: Array<{ id: LinkedIdentityProvider; label: string }> = [
  { id: 'google', label: 'Google' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'github', label: 'GitHub' },
  { id: 'discord', label: 'Discord' },
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'apple', label: 'Apple' },
];

export default function IdentityLinkedAccountsPage() {
  const [accounts, setAccounts] = useState<LinkedIdentityAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<LinkedIdentityProvider | string | null>(null);

  const loadAccounts = async () => {
    try {
      setAccounts(await getLinkedIdentityAccounts());
    } catch {
      toast.error('Unable to load linked accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const handleLink = async (provider: LinkedIdentityProvider) => {
    setWorking(provider);
    try {
      const authorizationUrl = await startLinkedIdentityOAuth(provider);
      window.location.assign(authorizationUrl);
    } catch {
      toast.error(`Unable to start ${provider} linking.`);
      setWorking(null);
    }
  };

  const handlePrimary = async (account: LinkedIdentityAccount) => {
    setWorking(account.id);
    try {
      const updated = await setPrimaryIdentityAccount(account.id);
      setAccounts((current) => current.map((entry) => ({ ...entry, isPrimary: entry.id === updated.id })));
      toast.success(`${account.provider} is now your primary account.`);
    } catch {
      toast.error('Unable to change the primary account.');
    } finally {
      setWorking(null);
    }
  };

  const handleUnlink = async (account: LinkedIdentityAccount) => {
    if (account.isPrimary) {
      toast.error('Set another account as primary before unlinking this one.');
      return;
    }
    if (!window.confirm(`Unlink your ${account.provider} account?`)) return;
    setWorking(account.id);
    try {
      await unlinkIdentityAccount(account.id);
      setAccounts((current) => current.filter((entry) => entry.id !== account.id));
      toast.success(`${account.provider} account unlinked.`);
    } catch {
      toast.error('Unable to unlink this account.');
    } finally {
      setWorking(null);
    }
  };

  const linkedProviders = new Set(accounts.map((account) => account.provider));

  return (
    <PageShell
      eyebrow="Identity"
      title="Linked accounts"
      description="Connect sign-in providers securely. Zynkra never receives your provider password."
    >
      {loading ? (
        <p className="text-sm text-dark-500 dark:text-dark-400">Loading linked accounts...</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-dark-900 dark:text-white">Add an account</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => (
                <Button
                  key={provider.id}
                  variant="secondary"
                  className="justify-start"
                  disabled={linkedProviders.has(provider.id) || working !== null}
                  onClick={() => void handleLink(provider.id)}
                >
                  <Link2 size={16} />
                  {linkedProviders.has(provider.id) ? `${provider.label} linked` : `Link ${provider.label}`}
                </Button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-dark-900 dark:text-white">Your linked accounts</h2>
            {accounts.length === 0 ? (
              <p className="text-sm text-dark-500 dark:text-dark-400">No external sign-in accounts are linked.</p>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div key={account.id} className="flex flex-col gap-3 rounded-xl border border-dark-200 bg-dark-50 p-4 dark:border-dark-700 dark:bg-dark-800/70 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium capitalize text-dark-900 dark:text-white">{account.provider}</p>
                      <p className="text-sm text-dark-500 dark:text-dark-400">{account.displayName || account.email || 'Verified external account'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {account.isPrimary ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200"><Star size={14} /> Primary</span>
                      ) : (
                        <Button variant="outline" size="sm" disabled={working !== null} onClick={() => void handlePrimary(account)}><Check size={14} /> Make primary</Button>
                      )}
                      <Button variant="destructive" size="sm" disabled={working !== null || account.isPrimary} onClick={() => void handleUnlink(account)} ariaLabel={`Unlink ${account.provider}`}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
}
