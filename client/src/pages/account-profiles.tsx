import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createAccountProfile, listAccountProfiles, setPrimaryAccountProfile, switchAccountProfile } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type ProfileType = 'personal' | 'creator' | 'business' | 'organization';
type AccountProfile = Awaited<ReturnType<typeof listAccountProfiles>>[number];

export default function AccountProfilesPage() {
  const { activeAccount } = useAuth();
  const [profiles, setProfiles] = useState<AccountProfile[]>([]);
  const [label, setLabel] = useState('');
  const [accountType, setAccountType] = useState<ProfileType>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      setProfiles(await listAccountProfiles());
    } catch {
      setError('Unable to load account profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfiles();
  }, [activeAccount?.user.id]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createAccountProfile({ label: label.trim(), accountType });
      setLabel('');
      await loadProfiles();
    } catch {
      setError('Unable to create this profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitch = async (profileId: string) => {
    setError(null);
    try {
      await switchAccountProfile(profileId);
      await loadProfiles();
    } catch {
      setError('Unable to switch profiles.');
    }
  };

  const handlePrimary = async (profileId: string) => {
    setError(null);
    try {
      await setPrimaryAccountProfile(profileId);
      await loadProfiles();
    } catch {
      setError('Unable to set the primary profile.');
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link to="/settings" className="text-sm text-primary-600 hover:underline">Back to settings</Link>
          <h1 className="mt-2 text-2xl font-bold text-dark-900 dark:text-white">Account profiles</h1>
          <p className="mt-1 text-sm text-dark-600 dark:text-dark-300">Keep personal, creator, and business identities separate.</p>
        </div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleCreate} className="mb-8 rounded-lg border border-dark-200 bg-white p-5 shadow-sm dark:border-dark-700 dark:bg-dark-800">
        <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Create a profile</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Profile name" maxLength={80} required className="rounded-md border border-dark-300 px-3 py-2 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
          <select value={accountType} onChange={(event) => setAccountType(event.target.value as ProfileType)} className="rounded-md border border-dark-300 px-3 py-2 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
            <option value="personal">Personal</option>
            <option value="creator">Creator</option>
            <option value="business">Business</option>
            <option value="organization">Organization</option>
          </select>
          <button type="submit" disabled={saving} className="rounded-md bg-primary-600 px-4 py-2 font-medium text-white disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button>
        </div>
      </form>

      <section aria-labelledby="profiles-heading">
        <h2 id="profiles-heading" className="mb-3 text-lg font-semibold text-dark-900 dark:text-white">Your profiles</h2>
        {loading ? <p className="text-sm text-dark-500">Loading profiles...</p> : profiles.length === 0 ? <p className="text-sm text-dark-500">No profiles yet.</p> : (
          <div className="space-y-3">
            {profiles.map((profile) => (
              <article key={profile.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dark-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
                <div>
                  <p className="font-semibold text-dark-900 dark:text-white">{profile.label} {profile.isPrimary && <span className="ml-2 text-xs font-normal text-primary-600">Primary</span>}</p>
                  <p className="text-sm capitalize text-dark-500">{profile.accountType}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => void handleSwitch(profile.id)} disabled={profile.isPrimary} className="rounded-md border border-dark-300 px-3 py-2 text-sm dark:border-dark-600 dark:text-white disabled:opacity-50">Switch</button>
                  <button type="button" onClick={() => void handlePrimary(profile.id)} disabled={profile.isPrimary} className="rounded-md bg-dark-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-dark-900">Set primary</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
