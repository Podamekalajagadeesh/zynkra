
import { useState, useEffect } from 'react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { useToast } from '../hooks/useToast';
import { api, getAgeVerificationStatus, setBirthDate, updatePrivacy } from '../lib/api';

export default function DataPrivacyPage() {
  const [exportStatus, setExportStatus] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [mentions, setMentions] = useState<'everyone' | 'friends' | 'no-one'>('everyone');
  const [activityVisibility, setActivityVisibility] = useState<'public' | 'friends' | 'private'>('friends');
  const [adPersonalization, setAdPersonalization] = useState(true);
  const [birthDate, setBirthDateValue] = useState('');
  const [ageStatus, setAgeStatus] = useState<any>(null);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/data-export');
        setExportStatus(response.data);
      } catch {
        // ignore
      }

      try {
        const profileResponse = await api.get('/users/me');
        const profile = profileResponse.data ?? {};
        setOnlineStatus(profile.showOnlineStatus !== false);
        setReadReceipts(profile.readReceipts !== false);
        setMentions((profile.mentions as any) ?? 'everyone');
        setActivityVisibility((profile.activityVisibility as any) ?? 'friends');
        setAdPersonalization(profile.adPersonalization !== false);
        if (profile.birthDate) {
          setBirthDateValue(new Date(profile.birthDate).toISOString().slice(0, 10));
        }
      } catch {
        // ignore
      }

      try {
        const status = await getAgeVerificationStatus();
        setAgeStatus(status);
      } catch {
        // ignore
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePrivacySave = async () => {
    setSavingPrivacy(true);
    try {
      await updatePrivacy({
        showOnlineStatus: onlineStatus,
        readReceipts: readReceipts,
        mentions,
        activityVisibility,
        adPersonalization,
      } as any);
      addToast('Privacy settings saved', 'success');
    } catch {
      addToast('Failed to save privacy settings', 'error');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleSetBirthDate = async () => {
    if (!birthDate) {
      addToast('Choose a birth date to continue', 'error');
      return;
    }
    try {
      await setBirthDate(birthDate);
      const status = await getAgeVerificationStatus();
      setAgeStatus(status);
      addToast('Age verification updated', 'success');
    } catch {
      addToast('Failed to update age verification', 'error');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await api.post('/data-export');
      addToast('Data export started', 'success');
    } catch {
      addToast('Failed to start data export', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/data-deletion');
      addToast('Account deletion requested', 'success');
      setDeleteDialogOpen(false);
      window.location.href = '/';
    } catch {
      addToast('Failed to request account deletion', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageShell
      title="Data & Privacy"
      description="Manage your data and privacy settings in compliance with GDPR/CCPA."
    >
      <div className="space-y-8">
        <div className="space-y-4 rounded-2xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900/70">
          <div>
            <h2 className="text-lg font-bold">Privacy controls</h2>
            <p className="text-sm text-gray-500">
              Manage the visibility of your profile activity and communication preferences.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-dark-200 bg-dark-50 p-3 dark:border-dark-700 dark:bg-dark-800/70">
              <span className="text-sm font-medium">Online status</span>
              <input type="checkbox" checked={onlineStatus} onChange={(e) => setOnlineStatus(e.target.checked)} className="h-4 w-4" />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-dark-200 bg-dark-50 p-3 dark:border-dark-700 dark:bg-dark-800/70">
              <span className="text-sm font-medium">Read receipts</span>
              <input type="checkbox" checked={readReceipts} onChange={(e) => setReadReceipts(e.target.checked)} className="h-4 w-4" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Mentions</span>
              <select value={mentions} onChange={(e) => setMentions(e.target.value as any)} className="w-full rounded-xl border border-dark-200 bg-white px-3 py-2 dark:border-dark-700 dark:bg-dark-900">
                <option value="everyone">Everyone</option>
                <option value="friends">Friends</option>
                <option value="no-one">No one</option>
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Activity visibility</span>
              <select value={activityVisibility} onChange={(e) => setActivityVisibility(e.target.value as any)} className="w-full rounded-xl border border-dark-200 bg-white px-3 py-2 dark:border-dark-700 dark:bg-dark-900">
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="private">Private</option>
              </select>
            </label>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-dark-200 bg-dark-50 p-3 dark:border-dark-700 dark:bg-dark-800/70">
            <span className="text-sm font-medium">Personalized ads</span>
            <input type="checkbox" checked={adPersonalization} onChange={(e) => setAdPersonalization(e.target.checked)} className="h-4 w-4" />
          </label>

          <div className="flex justify-end">
            <Button onClick={handlePrivacySave} disabled={savingPrivacy}>
              {savingPrivacy ? 'Saving...' : 'Save privacy settings'}
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-dark-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-900/70">
          <div>
            <h2 className="text-lg font-bold">Age verification</h2>
            <p className="text-sm text-gray-500">
              Confirm your age to unlock age-appropriate experiences and meet platform requirements.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm">
              <span className="mb-1 block font-medium">Birth date</span>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDateValue(e.target.value)}
                className="w-full rounded-xl border border-dark-200 bg-white px-3 py-2 dark:border-dark-700 dark:bg-dark-900"
              />
            </label>
            <Button variant="secondary" onClick={handleSetBirthDate}>Verify age</Button>
          </div>

          {ageStatus && (
            <div className="rounded-xl border border-dashed border-dark-200 bg-dark-50 p-3 text-sm text-dark-700 dark:border-dark-700 dark:bg-dark-800/70 dark:text-dark-200">
              {ageStatus.verified ? `Verified: ${ageStatus.isAdult ? 'Adult' : 'Minor'} (${ageStatus.age ?? 'age unknown'} years old)` : `Status: ${ageStatus.birthDateSet ? 'Pending verification' : 'No birth date set'}`}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">Export Your Data</h2>
            <p className="text-sm text-gray-500">
              Export a copy of your personal data in a machine-readable JSON format. This includes your profile information, posts, comments, and connections.
            </p>
          </div>
          {exportStatus && exportStatus.status === 'completed' ? (
            <a href={exportStatus.fileUrl} download>
              <Button>Download Export</Button>
            </a>
          ) : (
            <Button
              onClick={handleExport}
              disabled={exporting || (exportStatus && exportStatus.status === 'pending')}
            >
              {exporting || (exportStatus && exportStatus.status === 'pending')
                ? 'Preparing export...'
                : 'Request Data Export'}
            </Button>
          )}
        </div>

        <div className="space-y-4 border-t pt-8">
          <div>
            <h2 className="text-lg font-bold">Request Account Deletion</h2>
            <p className="text-sm text-gray-500">
              Permanently delete your account and all associated personal data. This action complies with GDPR/CCPA right to be forgotten requirements. Your data will be permanently removed within 30 days.
            </p>
          </div>
          <Button 
            variant="destructive" 
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleting}
          >
            Request Account Deletion
          </Button>
        </div>

        <div className="space-y-4 border-t pt-8">
          <div>
            <h2 className="text-lg font-bold">Privacy Policy & Data Usage</h2>
            <p className="text-sm text-gray-500">
              Review our full privacy policy to understand how we collect, use, and share your personal data in compliance with global privacy regulations.
            </p>
          </div>
          <a href="/privacy">
            <Button variant="secondary">View Privacy Policy</Button>
          </a>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone. All your personal data will be permanently removed within 30 days in compliance with GDPR and CCPA requirements.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? 'Processing...' : 'Confirm Deletion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}