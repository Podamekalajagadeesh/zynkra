
import { useState, useEffect, useRef } from 'react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { useToast } from '../hooks/useToast';
import { api, DEFAULT_PERSONALIZATION_CONTROLS, PersonalizationControls, requestAccountDeletion, confirmAccountDeletion, discoverContacts, getAgeVerificationStatus, resetPersonalizationControls, setBirthDate, updatePrivacy } from '../lib/api';
import { TagPrivacy } from '../lib/types';

export default function DataPrivacyPage() {
  const [exportStatus, setExportStatus] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [profilePrivacy, setProfilePrivacy] = useState<'public' | 'private'>('public');
  const [postVisibility, setPostVisibility] = useState<'public' | 'friends' | 'only_me'>('public');
  const [storyVisibility, setStoryVisibility] = useState<'public' | 'friends' | 'followers' | 'only_me'>('friends');
  const [searchVisibility, setSearchVisibility] = useState<'everyone' | 'friends' | 'no_one'>('everyone');
  const [readReceipts, setReadReceipts] = useState(true);
  const [contactDiscovery, setContactDiscovery] = useState(true);
  const [personalization, setPersonalization] = useState(true);
  const [mentions, setMentions] = useState<'everyone' | 'followers' | 'no_one'>('everyone');
  const [tagPrivacy, setTagPrivacy] = useState<TagPrivacy>(TagPrivacy.EVERYONE);
  const [activityVisibility, setActivityVisibility] = useState<'public' | 'friends' | 'private'>('friends');
  const [adPersonalization, setAdPersonalization] = useState(true);
  const [personalizationControls, setPersonalizationControls] = useState<PersonalizationControls>(DEFAULT_PERSONALIZATION_CONTROLS);
  const [birthDate, setBirthDateValue] = useState('');
  const [ageStatus, setAgeStatus] = useState<any>(null);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [contactInput, setContactInput] = useState('');
  const [discoveredContacts, setDiscoveredContacts] = useState<Array<{ id: string; username: string | null; displayName: string | null; avatar: string | null }>>([]);
  const [discoveringContacts, setDiscoveringContacts] = useState(false);
  const contactFileInputRef = useRef<HTMLInputElement>(null);
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
        setProfilePrivacy(profile.profilePrivacy ?? 'public');
        setPostVisibility(profile.postVisibility ?? 'public');
        setStoryVisibility(profile.storyVisibility ?? 'friends');
        setSearchVisibility(profile.searchVisibility ?? 'everyone');
        setReadReceipts(profile.readReceipts !== false);
        setContactDiscovery(profile.contactDiscovery !== false);
        setPersonalization(profile.personalization !== false);
        setMentions((profile.mentions as any) ?? 'everyone');
        setTagPrivacy(profile.tagPrivacy ?? TagPrivacy.EVERYONE);
        setActivityVisibility((profile.activityVisibility as any) ?? 'friends');
        setAdPersonalization(profile.adPersonalization !== false);
        setPersonalizationControls({ ...DEFAULT_PERSONALIZATION_CONTROLS, ...(profile.personalizationControls ?? {}) });
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
        profilePrivacy,
        postVisibility,
        storyVisibility,
        searchVisibility,
        showOnlineStatus: onlineStatus,
        readReceipts: readReceipts,
        contactDiscovery,
        personalization,
        mentions,
        tagPrivacy,
        activityVisibility,
        adPersonalization,
        personalizationControls,
      } as any);
      addToast('Privacy settings saved', 'success');
    } catch {
      addToast('Failed to save privacy settings', 'error');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleResetPersonalization = async () => {
    try {
      const response = await resetPersonalizationControls();
      setPersonalizationControls({ ...DEFAULT_PERSONALIZATION_CONTROLS, ...response.personalizationControls });
      addToast('Personalization controls reset', 'success');
    } catch {
      addToast('Failed to reset personalization controls', 'error');
    }
  };

  const personalizationOptions: Array<{ key: keyof PersonalizationControls; label: string; description: string }> = [
    { key: 'feedPersonalization', label: 'Feed personalization', description: 'Use your activity and interests to rank your For You feed.' },
    { key: 'searchPersonalization', label: 'Search personalization', description: 'Use your activity to improve search relevance.' },
    { key: 'recommendations', label: 'Recommendations', description: 'Personalize suggested people, content, and communities.' },
    { key: 'notificationPersonalization', label: 'Notification personalization', description: 'Prioritize notifications using your relationships and activity.' },
    { key: 'creatorPersonalization', label: 'Creator personalization', description: 'Personalize creator discovery and creator suggestions.' },
    { key: 'communityPersonalization', label: 'Community personalization', description: 'Personalize groups, forums, and community suggestions.' },
    { key: 'shoppingPersonalization', label: 'Shopping personalization', description: 'Personalize products, services, and marketplace suggestions.' },
    { key: 'eventPersonalization', label: 'Event personalization', description: 'Personalize event discovery and event reminders.' },
    { key: 'locationPersonalization', label: 'Location personalization', description: 'Use location context for local recommendations.' },
    { key: 'activityPersonalization', label: 'Activity personalization', description: 'Use your interactions and viewing activity for personalization.' },
  ];

  const handleContactDiscovery = async () => {
    const contacts = Array.from(new Set(
      contactInput
      .split(/[,;]+/)
        .map((contact) => contact.trim().toLowerCase())
        .map((contact) => contact.includes('@') ? contact : contact.replace(/[\s().-]/g, ''))
        .filter(Boolean),
    ));

    if (contacts.length === 0) {
      addToast('Enter at least one email address', 'error');
      return;
    }

    setDiscoveringContacts(true);
    try {
      const matches = await discoverContacts(contacts);
      setDiscoveredContacts(matches);
      addToast(`${matches.length} contact${matches.length === 1 ? '' : 's'} found`, 'success');
    } catch {
      addToast('Contact discovery failed', 'error');
    } finally {
      setDiscoveringContacts(false);
    }
  };

  const handleContactFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const text = await file.text();
    const importedContacts = text
      .split(/[\s,;]+/)
      .map((contact) => contact.trim())
      .filter(Boolean);
    setContactInput((current) => Array.from(new Set([...current.split(/[,;]+/), ...importedContacts]
      .map((contact) => contact.trim())
      .filter(Boolean))).join(', '));
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
    if (deleteConfirmation.trim().toUpperCase() !== 'DELETE') {
      addToast('Type DELETE to confirm permanent account deletion', 'error');
      return;
    }
    setDeleting(true);
    try {
      await requestAccountDeletion('privacy_concerns');
      await confirmAccountDeletion(deleteConfirmation);
      addToast('Account permanently deleted. You are being logged out.', 'success');
      setDeleteDialogOpen(false);
      setDeleteConfirmation('');
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
              <span className="font-medium" id="mention-controls-label">Mention controls</span>
              <select aria-label="Mention controls" value={mentions} onChange={(e) => setMentions(e.target.value as any)} className="w-full rounded-xl border border-dark-200 bg-white px-3 py-2 dark:border-dark-700 dark:bg-dark-900">
                <option value="everyone">Everyone</option>
                <option value="followers">Followers</option>
                <option value="no_one">No one</option>
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Tag controls</span>
              <select
                aria-label="Tag controls"
                value={tagPrivacy}
                onChange={(e) => setTagPrivacy(e.target.value as TagPrivacy)}
                className="w-full rounded-xl border border-dark-200 bg-white px-3 py-2 dark:border-dark-700 dark:bg-dark-900"
              >
                <option value={TagPrivacy.EVERYONE}>Everyone</option>
                <option value={TagPrivacy.FRIENDS}>Friends</option>
                <option value={TagPrivacy.FRIENDS_OF_FRIENDS}>Friends of friends</option>
                <option value={TagPrivacy.NO_ONE}>No one</option>
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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Profile privacy</span>
              <select value={profilePrivacy} onChange={(e) => setProfilePrivacy(e.target.value as any)} className="w-full rounded-xl border border-dark-200 bg-white px-3 py-2 dark:border-dark-700 dark:bg-dark-900">
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Post privacy</span>
              <select value={postVisibility} onChange={(e) => setPostVisibility(e.target.value as any)} className="w-full rounded-xl border border-dark-200 bg-white px-3 py-2 dark:border-dark-700 dark:bg-dark-900">
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="only_me">Only me</option>
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Story privacy</span>
              <select value={storyVisibility} onChange={(e) => setStoryVisibility(e.target.value as any)} className="w-full rounded-xl border border-dark-200 bg-white px-3 py-2 dark:border-dark-700 dark:bg-dark-900">
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="followers">Followers</option>
                <option value="only_me">Only me</option>
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Search visibility</span>
              <select value={searchVisibility} onChange={(e) => setSearchVisibility(e.target.value as any)} className="w-full rounded-xl border border-dark-200 bg-white px-3 py-2 dark:border-dark-700 dark:bg-dark-900">
                <option value="everyone">Everyone</option>
                <option value="friends">Friends</option>
                <option value="no_one">No one</option>
              </select>
            </label>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-dark-200 bg-dark-50 p-3 dark:border-dark-700 dark:bg-dark-800/70">
            <span className="text-sm font-medium">Personalized ads</span>
            <input type="checkbox" checked={adPersonalization} onChange={(e) => setAdPersonalization(e.target.checked)} className="h-4 w-4" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-dark-200 bg-dark-50 p-3 dark:border-dark-700 dark:bg-dark-800/70">
              <span className="text-sm font-medium">Contact discovery</span>
              <input type="checkbox" checked={contactDiscovery} onChange={(e) => setContactDiscovery(e.target.checked)} className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-dark-200 bg-dark-50 p-3 dark:border-dark-700 dark:bg-dark-800/70">
              <span className="text-sm font-medium">Personalization</span>
              <input aria-label="Personalization" type="checkbox" checked={personalization} onChange={(e) => setPersonalization(e.target.checked)} className="h-4 w-4" />
            </label>
          </div>

          <section className="space-y-4 rounded-xl border border-dark-200 bg-dark-50 p-4 dark:border-dark-700 dark:bg-dark-800/70" aria-labelledby="personalization-controls-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 id="personalization-controls-heading" className="font-semibold">Personalization controls</h3>
                <p className="text-sm text-gray-500">Choose which parts of Zynkra may use your activity to tailor what you see.</p>
              </div>
              <Button type="button" variant="secondary" onClick={handleResetPersonalization}>Reset defaults</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {personalizationOptions.map(({ key, label, description }) => (
                <label key={key} className="flex items-start justify-between gap-3 rounded-lg border border-dark-200 bg-white p-3 dark:border-dark-700 dark:bg-dark-900">
                  <span>
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="mt-1 block text-xs text-gray-500">{description}</span>
                  </span>
                  <input
                    aria-label={label}
                    type="checkbox"
                    checked={personalizationControls[key]}
                    onChange={(event) => setPersonalizationControls((current) => ({ ...current, [key]: event.target.checked }))}
                    className="mt-1 h-4 w-4 shrink-0"
                  />
                </label>
              ))}
            </div>
          </section>

          <div className="space-y-3 rounded-xl border border-dark-200 bg-dark-50 p-4 dark:border-dark-700 dark:bg-dark-800/70">
            <div>
              <h3 className="font-semibold">Find people you know</h3>
              <p className="text-sm text-gray-500">Enter email addresses or international phone numbers to find matching Zynkra profiles. Contacts are used only for this lookup.</p>
            </div>
            <textarea
              aria-label="Contact email addresses or phone numbers"
              value={contactInput}
              onChange={(event) => setContactInput(event.target.value)}
              placeholder="friend@example.com, +14155552671"
              rows={3}
              className="w-full rounded-xl border border-dark-200 bg-white px-3 py-2 dark:border-dark-700 dark:bg-dark-900"
            />
            <input ref={contactFileInputRef} type="file" accept=".csv,.txt,text/csv,text/plain" onChange={handleContactFile} className="hidden" />
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => contactFileInputRef.current?.click()} disabled={!contactDiscovery}>
                Import CSV or text
              </Button>
              <Button onClick={handleContactDiscovery} disabled={discoveringContacts || !contactDiscovery}>
                {discoveringContacts ? 'Searching...' : 'Find contacts'}
              </Button>
            </div>
            {discoveredContacts.length > 0 && (
              <div className="space-y-2" aria-label="Discovered contacts">
                {discoveredContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-3 rounded-lg border border-dark-200 bg-white p-3 dark:border-dark-700 dark:bg-dark-900">
                    {contact.avatar ? <img src={contact.avatar} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="h-9 w-9 rounded-full bg-dark-200 dark:bg-dark-700" />}
                    <div>
                      <p className="font-medium">{contact.displayName || contact.username || 'Zynkra user'}</p>
                      {contact.username && <p className="text-sm text-gray-500">@{contact.username}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              Permanently delete your account and all associated personal data. This action complies with GDPR/CCPA right to be forgotten requirements and takes effect after confirmation.
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
              Are you sure you want to delete your account? This action cannot be undone. After confirmation, your account and associated personal data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <input
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder="Type DELETE"
            aria-label="Type DELETE to confirm account deletion"
            className="w-full rounded-xl border border-red-300 bg-white px-3 py-2 text-sm"
            disabled={deleting}
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmation(''); }} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting || deleteConfirmation.trim().toUpperCase() !== 'DELETE'}>
              {deleting ? 'Processing...' : 'Confirm Deletion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}