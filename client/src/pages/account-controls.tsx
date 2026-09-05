import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, ExternalLink, FileUp, Layers3, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { AccountPermissionsSettings } from '../components/settings/account-permissions-settings';
import { DataPermissionsSettings } from '../components/settings/data-permissions-settings';
import {
  createAccountProfile,
  deactivateAccount,
  getAccountDashboard,
  importAccountData,
  listAccountProfiles,
  requestAccountExport,
  switchAccountProfile,
} from '../lib/api';
import { useAuth } from '../hooks/useAuth';

type AccountProfile = Awaited<ReturnType<typeof listAccountProfiles>>[number];

type Dashboard = Awaited<ReturnType<typeof getAccountDashboard>>;

export default function AccountControlsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [profiles, setProfiles] = useState<AccountProfile[]>([]);
  const [label, setLabel] = useState('');
  const [accountType, setAccountType] = useState<'personal' | 'creator' | 'business' | 'organization'>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [nextDashboard, nextProfiles] = await Promise.all([getAccountDashboard(), listAccountProfiles()]);
      setDashboard(nextDashboard);
      setProfiles(nextProfiles);
    } catch {
      toast.error('Unable to load account controls.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreateProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    try {
      await createAccountProfile({ label: label.trim(), accountType });
      setLabel('');
      toast.success('Account profile created.');
      await load();
    } catch {
      toast.error('Unable to create the account profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitch = async (profileId: string) => {
    try {
      await switchAccountProfile(profileId);
      toast.success('Account profile switched.');
      await load();
    } catch {
      toast.error('Unable to switch account profile.');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await requestAccountExport({
        includeSecurityLog: true,
        includeLinkedAccounts: true,
        includePrivacySettings: true,
        includeHistory: true,
      });
      toast.success(result.fileUrl ? 'Account export is ready.' : 'Account export requested.');
      if (result.fileUrl) window.open(result.fileUrl, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Unable to export account data.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImporting(true);
    try {
      const data = JSON.parse(await file.text());
      await importAccountData(data);
      toast.success('Account data imported.');
      await load();
    } catch {
      toast.error('Unable to import account data. Use a valid JSON export file.');
    } finally {
      setImporting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Deactivate your account? You can reactivate it later by signing in.')) return;
    setDeactivating(true);
    try {
      await deactivateAccount('Deactivated from Account Controls');
      toast.success('Account deactivated.');
      logout();
      navigate('/');
    } catch {
      toast.error('Unable to deactivate your account.');
    } finally {
      setDeactivating(false);
    }
  };

  const isDeactivated = dashboard?.account.deactivated;

  return (
    <PageShell
      eyebrow="Account"
      title="Account Controls"
      description="Manage account identity, profiles, permissions, data, and lifecycle controls from one place."
    >
      {loading ? <div className="surface-soft rounded-2xl p-6 text-sm">Loading account controls...</div> : (
        <div className="space-y-6">
          <section className="surface-soft rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck size={20} className="text-primary-600" />Account status</p>
                <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">Account ID: {dashboard?.account.accountId || 'Unavailable'}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isDeactivated ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {isDeactivated ? 'Deactivated' : 'Active'}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/account-status"><Button variant="secondary">Manage lifecycle</Button></Link>
              <Link to="/settings"><Button variant="secondary">All settings</Button></Link>
              {!isDeactivated && <Button variant="destructive" onClick={() => void handleDeactivate()} disabled={deactivating}>{deactivating ? 'Deactivating...' : 'Deactivate account'}</Button>}
            </div>
          </section>

          <section className="surface-soft rounded-2xl p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-lg font-semibold"><Layers3 size={20} className="text-primary-600" />Account profiles</p>
                <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">Keep personal, creator, business, and organization identities separate.</p>
              </div>
              <Link to="/account-profiles" className="text-sm text-primary-600">Open full manager <ExternalLink size={14} className="inline" /></Link>
            </div>
            <form onSubmit={handleCreateProfile} className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
              <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="New profile name" maxLength={80} required className="rounded-lg border border-dark-300 bg-white px-3 py-2 text-sm dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
              <select value={accountType} onChange={(event) => setAccountType(event.target.value as typeof accountType)} className="rounded-lg border border-dark-300 bg-white px-3 py-2 text-sm dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                <option value="personal">Personal</option><option value="creator">Creator</option><option value="business">Business</option><option value="organization">Organization</option>
              </select>
              <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create profile'}</Button>
            </form>
            <div className="space-y-2">
              {profiles.length === 0 ? <p className="text-sm text-dark-500">No account profiles found.</p> : profiles.map((profile) => (
                <div key={profile.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dark-200 bg-white p-3 dark:border-dark-700 dark:bg-dark-900/70">
                  <div className="flex items-center gap-3"><UserRound size={18} className="text-dark-400" /><div><p className="font-medium">{profile.label} {profile.isPrimary && <span className="text-xs text-primary-600">Primary</span>} {profile.isCurrent && <span className="text-xs text-emerald-600">Current</span>}</p><p className="text-xs capitalize text-dark-500">{profile.accountType}</p></div></div>
                  <Button variant="secondary" onClick={() => void handleSwitch(profile.id)} disabled={profile.isCurrent}>Switch</Button>
                </div>
              ))}
            </div>
          </section>

          <AccountPermissionsSettings />

          <DataPermissionsSettings />

          <section className="surface-soft rounded-2xl p-5">
            <p className="mb-1 flex items-center gap-2 text-lg font-semibold"><ShieldCheck size={20} className="text-primary-600" />Security and privacy</p>
            <p className="mb-4 text-sm text-dark-500 dark:text-dark-400">Open the focused controls for sign-in security, privacy, linked identities, and active sessions.</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/security-checkup"><Button variant="secondary">Security checkup</Button></Link>
              <Link to="/account-history"><Button variant="secondary">Account history</Button></Link>
              <Link to="/privacy"><Button variant="secondary">Privacy controls</Button></Link>
              <Link to="/settings/identity-accounts"><Button variant="secondary">Linked identities</Button></Link>
              <Link to="/sessions"><Button variant="secondary">Active sessions</Button></Link>
            </div>
          </section>

          <section className="surface-soft rounded-2xl p-5">
            <p className="mb-1 flex items-center gap-2 text-lg font-semibold"><Download size={20} className="text-primary-600" />Your data</p>
            <p className="mb-4 text-sm text-dark-500 dark:text-dark-400">Request a JSON export containing your profile, content, settings, security log, linked accounts, privacy settings, and account history.</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => void handleExport()} disabled={exporting || importing}>{exporting ? 'Preparing export...' : 'Export account data'}</Button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dark-300 bg-white px-4 py-2 text-sm font-medium text-dark-800 hover:bg-dark-50 dark:border-dark-600 dark:bg-dark-900 dark:text-white dark:hover:bg-dark-800">
                <FileUp size={16} />
                {importing ? 'Importing...' : 'Import JSON data'}
                <input type="file" accept="application/json,.json" className="sr-only" onChange={(event) => void handleImport(event)} disabled={importing || exporting} />
              </label>
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
}
