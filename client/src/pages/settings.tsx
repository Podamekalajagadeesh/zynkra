import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Cog, FileText, Globe, Keyboard, KeyRound, MoonStar, Shield, ShieldAlert, ShieldCheck, SunMedium, Trash2, User as UserIcon, UserCheck, Users, ArrowUpDown, Heart, Brain, Timer, Eye, Mic, Expand, Accessibility, Contrast, Minimize2, Lock, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog.tsx';
import { useAuth } from '../hooks/useAuth';
import {
  api,
  approveLoginSession,
  generateRecoveryCodes,
  getLoginSessions,
  getProfile,
  getAccountPreferences,
  getTrustedRecoveryContacts,
  revokeLoginSession,
  revokeOtherSessions,
  setTrustedRecoveryContacts,
  updatePrivacy,
  updateAccountPreferences,
  LoginSession,
} from '../lib/api';
import { LANGUAGE_OPTIONS, REGION_OPTIONS, COLOR_BLIND_OPTIONS } from '../lib/preferences';
import { useAppPreferences } from '../contexts/PreferencesContext';
import { ProfilePrivacy } from '../types';
import { NotificationSettings } from '../components/settings/notification-settings';
import { FaceRecognitionSettings } from '../components/settings/face-recognition-settings';
import AdPreferences from '../components/settings/ad-preferences';
import { AppIconSettings } from '../components/settings/app-icon-settings';
import { ActivityStatusSettings } from '../components/settings/ActivityStatusSettings';
import { NeuralEthicalGuardrails } from '../components/ethical-ai-guardrails/NeuralEthicalGuardrails';
import { AccountPermissionsSettings } from '../components/settings/account-permissions-settings';
import { LANGUAGE_METADATA, translateTextKey } from '../lib/i18n';

export function SettingsPage() {
  const { activeAccount, logout } = useAuth();
  const navigate = useNavigate();
  const {
    theme,
    appIcon,
    setAppIcon: setAppIconState,
    language,
    region,
    keyboardNavigationEnabled,
    autoTranslate,
    locale,
    feedSort,
    screenTimeEnabled,
    dailyScreenTimeLimit,
    contentWarningsEnabled,
    // Accessibility preferences
    highContrastMode,
    reducedMotion,
    screenReaderOptimized,
    voiceControlEnabled,
    largeTextMode,
    colorBlindMode,
    setTheme: setThemeState,
    setLanguage: setLanguageState,
    setRegion: setRegionState,
    setKeyboardNavigationEnabled: setKeyboardNavigationEnabledState,
    setAutoTranslate: setAutoTranslateState,
    setFeedSort: setFeedSortState,
    setScreenTimeEnabled: setScreenTimeEnabledState,
    setDailyScreenTimeLimit: setDailyScreenTimeLimitState,
    setContentWarningsEnabled: setContentWarningsEnabledState,
    // Accessibility setters
    setHighContrastMode: setHighContrastModeState,
    setReducedMotion: setReducedMotionState,
    setScreenReaderOptimized: setScreenReaderOptimizedState,
    setVoiceControlEnabled: setVoiceControlEnabledState,
    setLargeTextMode: setLargeTextModeState,
    setColorBlindMode: setColorBlindModeState,
  } = useAppPreferences();
  const [profilePrivacy, setProfilePrivacy] = useState<ProfilePrivacy | null>(null);
  const [tagReviewEnabled, setTagReviewEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isGeneratingRecoveryCodes, setIsGeneratingRecoveryCodes] = useState(false);
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [trustedContacts, setTrustedContacts] = useState<string[]>([]);
  const [trustedContactsInput, setTrustedContactsInput] = useState('');
  const [savingTrustedContacts, setSavingTrustedContacts] = useState(false);
  const [timezone, setTimezone] = useState('UTC');
  const [defaultPrivacy, setDefaultPrivacy] = useState<'public' | 'friends' | 'private'>('friends');

  const saveAccountPreference = async (change: Parameters<typeof updateAccountPreferences>[0]) => {
    try {
      await updateAccountPreferences(change);
    } catch (error) {
      console.error('Failed to update account preference', error);
      toast.error('Failed to save account preference.');
    }
  };

  const setTheme = (nextTheme: typeof theme) => {
    setThemeState(nextTheme);
    void saveAccountPreference({ theme: nextTheme });
  };
  const setLanguage = (nextLanguage: typeof language) => {
    setLanguageState(nextLanguage);
    void saveAccountPreference({ language: nextLanguage });
  };
  const setRegion = (nextRegion: typeof region) => {
    setRegionState(nextRegion);
    void saveAccountPreference({ customSettings: { region: nextRegion } });
  };
  const setKeyboardNavigationEnabled = (enabled: boolean) => {
    setKeyboardNavigationEnabledState(enabled);
    void saveAccountPreference({ keyboardNavigationEnabled: enabled });
  };
  const setAutoTranslate = (enabled: boolean) => {
    setAutoTranslateState(enabled);
    void saveAccountPreference({ autoTranslate: enabled });
  };
  const setFeedSort = (sort: typeof feedSort) => {
    setFeedSortState(sort);
    void saveAccountPreference({ feedSort: sort });
  };
  const setScreenTimeEnabled = (enabled: boolean) => {
    setScreenTimeEnabledState(enabled);
    void saveAccountPreference({ screenTimeEnabled: enabled });
  };
  const setDailyScreenTimeLimit = (limit: number) => {
    setDailyScreenTimeLimitState(limit);
    void saveAccountPreference({ dailyScreenTimeLimit: limit });
  };
  const setContentWarningsEnabled = (enabled: boolean) => {
    setContentWarningsEnabledState(enabled);
    void saveAccountPreference({ contentWarningsEnabled: enabled });
  };
  const setHighContrastMode = (enabled: boolean) => {
    setHighContrastModeState(enabled);
    void saveAccountPreference({ highContrastMode: enabled });
  };
  const setReducedMotion = (enabled: boolean) => {
    setReducedMotionState(enabled);
    void saveAccountPreference({ reducedMotion: enabled });
  };
  const setScreenReaderOptimized = (enabled: boolean) => {
    setScreenReaderOptimizedState(enabled);
    void saveAccountPreference({ screenReaderOptimized: enabled });
  };
  const setVoiceControlEnabled = (enabled: boolean) => {
    setVoiceControlEnabledState(enabled);
    void saveAccountPreference({ voiceControlEnabled: enabled });
  };
  const setLargeTextMode = (enabled: boolean) => {
    setLargeTextModeState(enabled);
    void saveAccountPreference({ largeTextMode: enabled });
  };
  const setColorBlindMode = (mode: typeof colorBlindMode) => {
    setColorBlindModeState(mode);
    void saveAccountPreference({ colorBlindMode: mode });
  };

  useEffect(() => {
    const fetchSecurityData = async () => {
      if (!activeAccount) {
        setLoading(false);
        setSessionsLoading(false);
        return;
      }

      try {
        const currentUser = await getProfile();
        setProfilePrivacy((currentUser.profilePrivacy as ProfilePrivacy) ?? null);
        setTagReviewEnabled(currentUser.tagReviewEnabled ?? false);
      } catch (error) {
        console.error('Failed to fetch user profile', error);
        toast.error('Failed to load profile settings.');
      } finally {
        setLoading(false);
      }

      try {
        const accountPreferences = await getAccountPreferences();
        if (accountPreferences.theme !== 'system') setThemeState(accountPreferences.theme);
        if (accountPreferences.appIcon) setAppIconState(accountPreferences.appIcon as typeof appIcon);
        if (LANGUAGE_OPTIONS.some((option) => option.value === accountPreferences.language)) {
          setLanguageState(accountPreferences.language as typeof language);
        }
        if (accountPreferences.timezone) setTimezone(accountPreferences.timezone);
        if (accountPreferences.defaultPrivacy) setDefaultPrivacy(accountPreferences.defaultPrivacy);
        if (typeof accountPreferences.customSettings?.region === 'string') {
          setRegionState(accountPreferences.customSettings.region as typeof region);
        }
        setKeyboardNavigationEnabledState(accountPreferences.keyboardNavigationEnabled);
        setAutoTranslateState(accountPreferences.autoTranslate);
        setFeedSortState(accountPreferences.feedSort);
        setScreenTimeEnabledState(accountPreferences.screenTimeEnabled);
        setDailyScreenTimeLimitState(accountPreferences.dailyScreenTimeLimit);
        setContentWarningsEnabledState(accountPreferences.contentWarningsEnabled);
        setHighContrastModeState(accountPreferences.highContrastMode);
        setReducedMotionState(accountPreferences.reducedMotion);
        setScreenReaderOptimizedState(accountPreferences.screenReaderOptimized);
        setVoiceControlEnabledState(accountPreferences.voiceControlEnabled);
        setLargeTextModeState(accountPreferences.largeTextMode);
        setColorBlindModeState(accountPreferences.colorBlindMode);
      } catch (error) {
        console.error('Failed to fetch account preferences', error);
        toast.error('Failed to load account preferences.');
      }

      try {
        const sessionList = await getLoginSessions();
        setSessions(sessionList);
      } catch (error) {
        console.error('Failed to fetch sessions', error);
        toast.error('Failed to load active sessions.');
      } finally {
        setSessionsLoading(false);
      }

      try {
        const response = await getTrustedRecoveryContacts();
        setTrustedContacts(response.contacts);
        setTrustedContactsInput(response.contacts.join(', '));
      } catch (error) {
        console.error('Failed to fetch trusted recovery contacts', error);
      }
    };

    fetchSecurityData();
  }, [activeAccount]);

  const refreshSessions = async () => {
    try {
      const sessionList = await getLoginSessions();
      setSessions(sessionList);
    } catch (error) {
      console.error('Failed to refresh sessions', error);
      toast.error('Failed to refresh sessions.');
    }
  };

  const handlePrivacyChange = async (newPrivacy: ProfilePrivacy) => {
    try {
      await updatePrivacy({ profilePrivacy: newPrivacy });
      setProfilePrivacy(newPrivacy);
      toast.success('Privacy setting updated.');
    } catch (error) {
      console.error('Failed to update privacy setting', error);
      toast.error('Failed to update privacy setting.');
    }
  };

  const handleTagReviewToggle = async () => {
    try {
      const updatedUser = await api.patch('/users/me', { tagReviewEnabled: !tagReviewEnabled });
      setTagReviewEnabled(updatedUser.data.tagReviewEnabled);
      toast.success('Profile review setting updated.');
    } catch (error) {
      console.error('Failed to update profile review setting', error);
      toast.error('Failed to update profile review setting.');
    }
  };

  const handleGenerateRecoveryCodes = async () => {
    setIsGeneratingRecoveryCodes(true);
    try {
      const { codes } = await generateRecoveryCodes();
      setRecoveryCodes(codes);
      toast.success('Recovery codes generated. Save them somewhere safe.');
    } catch (error) {
      console.error('Failed to generate recovery codes', error);
      toast.error('Failed to generate recovery codes.');
    } finally {
      setIsGeneratingRecoveryCodes(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeLoginSession(sessionId);
      setSessions((currentSessions) => currentSessions.filter((session) => session.id !== sessionId));
      toast.success('Session revoked.');
    } catch (error) {
      console.error('Failed to revoke session', error);
      toast.error('Failed to revoke session.');
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      await revokeOtherSessions();
      await refreshSessions();
      toast.success('Other sessions revoked.');
    } catch (error) {
      console.error('Failed to revoke other sessions', error);
      toast.error('Failed to revoke other sessions.');
    }
  };

  const handleApproveSession = async (sessionId: string) => {
    try {
      await approveLoginSession(sessionId);
      await refreshSessions();
      toast.success('Session approved.');
    } catch (error) {
      console.error('Failed to approve session', error);
      toast.error('Failed to approve session.');
    }
  };

  const handleSaveTrustedContacts = async () => {
    setSavingTrustedContacts(true);
    try {
      const contacts = trustedContactsInput
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
      const response = await setTrustedRecoveryContacts(contacts);
      setTrustedContacts(response.contacts);
      setTrustedContactsInput(response.contacts.join(', '));
      toast.success('Trusted recovery contacts updated.');
    } catch (error) {
      console.error('Failed to update trusted recovery contacts', error);
      toast.error('Failed to update trusted recovery contacts.');
    } finally {
      setSavingTrustedContacts(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      await api.post('/users/deactivate');
      logout();
      navigate('/');
      toast.success('Your account has been deactivated.');
    } catch (error) {
      console.error('Failed to deactivate account', error);
      toast.error('Failed to deactivate account.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete('/users/me');
      logout();
      navigate('/');
      toast.success('Your account has been permanently deleted.');
    } catch (error) {
      console.error('Failed to delete account', error);
      toast.error('Failed to delete account.');
    }
  };

  return (
    <PageShell
      title="Settings"
      eyebrow="Account"
      description="Manage your account, recovery, privacy, display, and navigation settings."
    >
      <div className="space-y-lg">
        <div className="surface-soft rounded-2xl p-5">
          <NeuralEthicalGuardrails />
        </div>

        <AccountPermissionsSettings />

        {/* Neural Encryption Settings - Preview */}
        <div className="surface-soft rounded-2xl p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-lg flex items-center gap-2">
                <Lock size={20} className="text-amber-600" />
                Encryption — Preview
              </p>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                All messages are encrypted in transit (TLS). Full end-to-end encryption is in progress —
                see the roadmap for details.
              </p>

            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <Clock size={16} />
                Time zone
              </div>
              <input
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                onBlur={() => void saveAccountPreference({ timezone })}
                placeholder="UTC"
                className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm text-dark-900 shadow-sm outline-none transition focus:border-primary-500 dark:border-dark-700 dark:bg-dark-900 dark:text-white"
              />
              <p className="text-xs text-dark-500 dark:text-dark-400">Used for dates, times, and scheduled activity.</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <Shield size={16} />
                Default post privacy
              </div>
              <select
                value={defaultPrivacy}
                onChange={(event) => {
                  const nextPrivacy = event.target.value as typeof defaultPrivacy;
                  setDefaultPrivacy(nextPrivacy);
                  void saveAccountPreference({ defaultPrivacy: nextPrivacy });
                }}
                className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm text-dark-900 shadow-sm outline-none transition focus:border-primary-500 dark:border-dark-700 dark:bg-dark-900 dark:text-white"
              >
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="private">Private</option>
              </select>
              <p className="text-xs text-dark-500 dark:text-dark-400">The default audience for new posts.</p>
            </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-dark-900 dark:text-white">Transport Encryption</p>
                <p className="text-xs text-dark-500 dark:text-dark-400">All data is encrypted in transit using TLS</p>
              </div>
              <Switch checked={true} disabled={true} />
            </div>
          </div>
        </div>

        <div className="surface-soft rounded-2xl p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-lg">Display and Navigation</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                Language, region, theme, and keyboard navigation are stored locally and applied across the app.
              </p>
            </div>
            <Cog className="mt-1 text-dark-500 dark:text-dark-400" size={20} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <Globe size={16} />
                {translateTextKey('settings.language', language)}
              </div>
              <select
                value={language}
                onChange={(event) => {
                  const nextLanguage = event.target.value as typeof language;
                  setLanguage(nextLanguage);
                  void saveAccountPreference({ language: nextLanguage });
                }}
                className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm text-dark-900 shadow-sm outline-none transition focus:border-primary-500 dark:border-dark-700 dark:bg-dark-900 dark:text-white"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                Switch language preferences and the app will update its locale and reading direction.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <Globe size={16} />
                {translateTextKey('settings.region', language)}
              </div>
              <select
                value={region}
                onChange={(event) => {
                  const nextRegion = event.target.value as typeof region;
                  setRegion(nextRegion);
                  void saveAccountPreference({ customSettings: { region: nextRegion } });
                }}
                className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm text-dark-900 shadow-sm outline-none transition focus:border-primary-500 dark:border-dark-700 dark:bg-dark-900 dark:text-white"
              >
                {REGION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                {REGION_OPTIONS.find((option) => option.value === region)?.description}
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <MoonStar size={16} />
                Dark mode
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={theme === 'light' ? 'primary' : 'secondary'}
                  onClick={() => {
                    setTheme('light');
                    void saveAccountPreference({ theme: 'light' });
                  }}
                  disabled={theme === 'light'}
                  className="justify-center"
                >
                  <SunMedium size={16} />
                  Light
                </Button>
                <Button
                  type="button"
                  variant={theme === 'dark' ? 'primary' : 'secondary'}
                  onClick={() => {
                    setTheme('dark');
                    void saveAccountPreference({ theme: 'dark' });
                  }}
                  disabled={theme === 'dark'}
                  className="justify-center"
                >
                  <MoonStar size={16} />
                  Dark
                </Button>
              </div>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                The selected theme is applied immediately across the app.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <Keyboard size={16} />
                Keyboard navigation
              </div>
              <Button
                type="button"
                variant={keyboardNavigationEnabled ? 'primary' : 'secondary'}
                onClick={() => setKeyboardNavigationEnabled(!keyboardNavigationEnabled)}
                className="w-full justify-center"
              >
                {keyboardNavigationEnabled ? 'Enabled' : 'Disabled'}
              </Button>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                {keyboardNavigationEnabled
                  ? 'Shortcuts enabled: / focuses search, g then h home, g then s settings, g then p profile, g then d messages, g then n notifications.'
                  : 'Enable app-wide shortcuts for quick navigation.'}
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <ArrowUpDown size={16} />
                Feed sort order
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={feedSort === 'algorithmic' ? 'primary' : 'secondary'}
                  onClick={() => setFeedSort('algorithmic')}
                  className="flex-1 justify-center"
                >
                  Algorithmic
                </Button>
                <Button
                  type="button"
                  variant={feedSort === 'chronological' ? 'primary' : 'secondary'}
                  onClick={() => setFeedSort('chronological')}
                  className="flex-1 justify-center"
                >
                  Chronological (newest first)
                </Button>
              </div>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                Choose how your feed is sorted: algorithmic relevance or reverse-chronological (newest first).
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <Globe size={16} />
                {translateTextKey('settings.autoTranslate', language)}
              </div>
              <Button
                type="button"
                variant={autoTranslate ? 'primary' : 'secondary'}
                onClick={() => setAutoTranslate(!autoTranslate)}
                className="w-full justify-center"
              >
                {autoTranslate ? 'Enabled' : 'Disabled'}
              </Button>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                Automatically translate posts from other languages to your preferred language.
              </p>
            </div>

            <AppIconSettings />
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-dark-200 bg-dark-50/70 p-4 text-sm text-dark-600 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-300">
            <p className="font-semibold text-dark-900 dark:text-white">Live preview</p>
            <p className="mt-1">Locale: {locale}</p>
            <p>
              Sample date: {new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short' }).format(new Date('2026-05-28T13:45:00Z'))}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-dark-500 dark:text-dark-400">
              {LANGUAGE_METADATA[language === 'system' ? (navigator.language.split('-')[0] || 'en') : language]?.nativeLabel || 'English'} • {language === 'system' ? 'System default' : 'Selected'}
            </p>
          </div>
        </div>

        <div className="surface-soft rounded-2xl p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-lg">Mental Health & Wellbeing</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                Manage screen time limits, content warnings, and access mental health resources.
              </p>
            </div>
            <Heart className="mt-1 text-dark-500 dark:text-dark-400" size={20} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <Timer size={16} />
                Daily Screen Time Limit
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={screenTimeEnabled}
                  onCheckedChange={setScreenTimeEnabled}
                />
                <span className="text-sm text-dark-600 dark:text-dark-300">
                  {screenTimeEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {screenTimeEnabled && (
                <div className="mt-3">
                  <select
                    value={dailyScreenTimeLimit}
                    onChange={(e) => setDailyScreenTimeLimit(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm text-dark-900 shadow-sm outline-none transition focus:border-primary-500 dark:border-dark-700 dark:bg-dark-900 dark:text-white"
                  >
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                    <option value={240}>4 hours</option>
                    <option value={360}>6 hours</option>
                    <option value={480}>8 hours</option>
                  </select>
                  <p className="mt-2 text-xs text-dark-500 dark:text-dark-400">
                    You'll receive a reminder when you reach your daily limit.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <Brain size={16} />
                Content Warnings
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={contentWarningsEnabled}
                  onCheckedChange={setContentWarningsEnabled}
                />
                <span className="text-sm text-dark-600 dark:text-dark-300">
                  {contentWarningsEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                Automatically show warnings for potentially triggering content (violence, self-harm, etc.).
              </p>
            </div>

            <ActivityStatusSettings />

            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70 lg:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <Heart size={16} />
                Mental Health Resources
              </div>
              <p className="text-sm text-dark-600 dark:text-dark-300">
                If you're struggling with mental health, please reach out to these trusted resources:
              </p>
              <ul className="mt-2 space-y-2 text-sm text-primary-600 dark:text-primary-400">
                <li>• National Suicide Prevention Lifeline: 988 (US)</li>
                <li>• Crisis Text Line: Text HOME to 741741 (US)</li>
                <li>• International Association for Suicide Prevention: iasp.info/resources/Crisis_Centres/</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="surface-soft rounded-2xl p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-lg">Accessibility & Assistive Technologies</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                Voice control, screen reader support, and sensory-friendly modes to customize your experience.
              </p>
            </div>
            <Accessibility className="mt-1 text-dark-500 dark:text-dark-400" size={20} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <Mic size={16} />
                Voice Control
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={voiceControlEnabled}
                  onCheckedChange={setVoiceControlEnabled}
                />
                <span className="text-sm text-dark-600 dark:text-dark-300">
                  {voiceControlEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                {voiceControlEnabled
                  ? 'Voice commands active: "go home", "go to settings", "open search", "go to messages", "go to notifications"'
                  : 'Enable voice recognition to navigate the app using speech commands.'}
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <Eye size={16} />
                Screen Reader Optimized
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={screenReaderOptimized}
                  onCheckedChange={setScreenReaderOptimized}
                />
                <span className="text-sm text-dark-600 dark:text-dark-300">
                  {screenReaderOptimized ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                Enhances ARIA labels and semantic markup for better compatibility with screen readers.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <Contrast size={16} />
                High Contrast Mode
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={highContrastMode}
                  onCheckedChange={setHighContrastMode}
                />
                <span className="text-sm text-dark-600 dark:text-dark-300">
                  {highContrastMode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                Increases contrast ratios for better visibility for users with low vision.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <Minimize2 size={16} />
                Reduced Motion
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={reducedMotion}
                  onCheckedChange={setReducedMotion}
                />
                <span className="text-sm text-dark-600 dark:text-dark-300">
                  {reducedMotion ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                Disables all non-essential animations and transitions for vestibular disorder sufferers.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <Expand size={16} />
                Large Text Mode
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={largeTextMode}
                  onCheckedChange={setLargeTextMode}
                />
                <span className="text-sm text-dark-600 dark:text-dark-300">
                  {largeTextMode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                Scales all text sizes up by 25% for improved readability.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
              <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
                <Eye size={16} />
                Color Blindness Correction
              </div>
              <select
                value={colorBlindMode}
                onChange={(event) => setColorBlindMode(event.target.value as typeof colorBlindMode)}
                className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm text-dark-900 shadow-sm outline-none transition focus:border-primary-500 dark:border-dark-700 dark:bg-dark-900 dark:text-white"
              >
                {COLOR_BLIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                {COLOR_BLIND_OPTIONS.find((option) => option.value === colorBlindMode)?.description}
              </p>
            </div>
          </div>
        </div>

        <SettingItem
          icon={<UserIcon size={20} />}
          title="Edit Profile"
          description="Update your display name, bio, avatar, and other profile information."
          action={
            <Link to="/edit-profile">
              <Button variant="secondary">Edit Profile</Button>
            </Link>
          }
        />

        <SettingItem
          icon={<BadgeCheck size={20} />}
          title="Request Verification"
          description="Apply for the verified badge on your profile."
          action={
            <Link to="/request-verification">
              <Button variant="secondary">Apply</Button>
            </Link>
          }
        />

        <SettingItem
          icon={<Shield size={20} />}
          title="Manage Passkeys"
          description="Manage your passwordless sign-in methods for enhanced security."
          action={
            <Link to="/passkeys">
              <Button variant="secondary">Manage Passkeys</Button>
            </Link>
          }
        />

        <SettingItem
          icon={<ShieldCheck size={20} />}
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your account with an authenticator app."
          action={
            <Link to="/settings/2fa">
              <Button variant="secondary">Manage 2FA</Button>
            </Link>
          }
        />

        <SettingItem
          icon={<Shield size={20} className="text-blue-600 dark:text-blue-400" />}
          title="Blockchain 4.0 Identity"
          description="Manage your self-sovereign digital identity, verify content ownership, and view your immutable proof of ownership records."
          action={
            <Link to="/blockchain-identity">
              <Button variant="secondary">Manage Identity</Button>
            </Link>
          }
        />

        <SettingItem
          icon={<Shield size={20} />}
          title="Privacy Shortcuts"
          description="A simplified view of your most important privacy settings."
          action={
            <Link to="/privacy/shortcuts">
              <Button variant="secondary">Review</Button>
            </Link>
          }
        />

        <SettingItem
          icon={<ShieldAlert size={20} />}
          title="Security Checkup"
          description="Review live login alerts, suspicious sessions, and approved devices in one place."
          action={
            <Link to="/security-checkup">
              <Button variant="secondary">Open Checkup</Button>
            </Link>
          }
        />

        <SettingItem
          icon={<Users size={20} />}
          title="Close Friends"
          description="Manage your Close Friends list for sharing stories."
          action={
            <Link to="/settings/close-friends">
              <Button variant="secondary">Manage</Button>
            </Link>
          }
        />

        <SettingItem
          icon={<Users size={20} />}
          title="Custom Audiences"
          description="Create unlimited custom groups for granular story sharing (Premium feature)."
          action={
            <Link to="/settings/custom-audiences">
              <Button variant="secondary">Manage</Button>
            </Link>
          }
        />

        <SettingItem
          icon={<Clock size={20} />}
          title="Snooze Management"
          description="Manage snoozed users, groups, and pages."
          action={
            <Link to="/settings/snooze">
              <Button variant="secondary">Manage</Button>
            </Link>
          }
        />

        <SettingItem
          icon={<FileText size={20} />}
          title="Timeline Review"
          description="Review posts you're tagged in before they appear on your timeline."
          action={
            <Link to="/timeline/review">
              <Button variant="secondary">Review</Button>
            </Link>
          }
        />

        <SettingItem
          icon={<UserCheck size={20} />}
          title="Profile Review"
          description="Review posts you're tagged in before they appear on your profile."
          action={
            <div className="flex items-center gap-2">
              <Link to="/profile-review">
                <Button variant="secondary">Review</Button>
              </Link>
              <Switch
                checked={tagReviewEnabled}
                onCheckedChange={handleTagReviewToggle}
              />
            </div>
          }
        />

        <SettingItem
          icon={<FileText size={20} />}
          title="Data & Privacy"
          description="Request an export of your data or manage connected applications."
          action={
            <Link to="/data-privacy">
              <Button variant="secondary">Manage</Button>
            </Link>
          }
        />

        <SettingItem
          icon={<Globe size={20} />}
          title="Connected Accounts"
          description="Manage your connected social media accounts."
          action={
            <Link to="/settings/identity-accounts">
              <Button variant="secondary">Manage</Button>
            </Link>
          }
        />

        <FaceRecognitionSettings />

        <AdPreferences />

        <div className="surface-soft rounded-lg p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-lg">Recovery Codes</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                Generate one-time codes to regain access if you lose your password or passkey.
              </p>
            </div>
            <Button variant="secondary" onClick={handleGenerateRecoveryCodes} disabled={isGeneratingRecoveryCodes}>
              <KeyRound size={16} className="mr-2" />
              {isGeneratingRecoveryCodes ? 'Generating...' : 'Generate Codes'}
            </Button>
          </div>
          {recoveryCodes.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {recoveryCodes.map((code) => (
                <div key={code} className="rounded-md border border-dashed border-dark-300 bg-white px-3 py-2 font-mono text-sm dark:border-dark-700 dark:bg-dark-900">
                  {code}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dark-500 dark:text-dark-400">No recovery codes generated yet.</p>
          )}
        </div>

        <div className="surface-soft rounded-lg p-5">
          <div className="mb-4">
            <p className="font-semibold text-lg">Trusted Recovery Contacts</p>
            <p className="text-sm text-dark-500 dark:text-dark-400">
              Add up to five trusted emails that can receive a one-time recovery code.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm text-dark-900 shadow-sm outline-none transition focus:border-primary-500 dark:border-dark-700 dark:bg-dark-900 dark:text-white"
              value={trustedContactsInput}
              onChange={(event) => setTrustedContactsInput(event.target.value)}
              placeholder="friend1@example.com, friend2@example.com"
            />
            <Button variant="secondary" onClick={handleSaveTrustedContacts} disabled={savingTrustedContacts}>
              {savingTrustedContacts ? 'Saving...' : 'Save Contacts'}
            </Button>
          </div>
          {trustedContacts.length > 0 && (
            <p className="mt-3 text-xs text-dark-500 dark:text-dark-400">
              Active contacts: {trustedContacts.join(', ')}
            </p>
          )}
        </div>

        <div className="surface-soft rounded-lg p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-lg">Active Sessions</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                Review where your account is signed in and revoke devices you do not recognize.
              </p>
            </div>
            <Button variant="secondary" onClick={handleRevokeOtherSessions}>
              Revoke Other Sessions
            </Button>
          </div>

          {sessionsLoading ? (
            <p className="text-sm text-dark-500 dark:text-dark-400">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-dark-500 dark:text-dark-400">No sessions found.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex flex-col gap-3 rounded-lg border border-dark-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-900 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-dark-900 dark:text-white">{session.deviceName || 'Unknown device'}</p>
                      {session.isCurrent && (
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">Current</span>
                      )}
                      {session.isRevoked && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">Revoked</span>
                      )}
                      {session.suspicious && !session.isApproved && !session.isRevoked && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Pending approval</span>
                      )}
                    </div>
                    <p className="text-xs text-dark-500 dark:text-dark-400">
                      {session.ipAddress || 'Unknown IP'} · Started {new Date(session.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-dark-500 dark:text-dark-400">
                      Last seen {session.lastSeenAt ? new Date(session.lastSeenAt).toLocaleString() : 'just now'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!session.isApproved && !session.isRevoked && (
                      <Button variant="secondary" onClick={() => handleApproveSession(session.id)}>
                        Approve
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={session.isCurrent || session.isRevoked}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="surface-soft rounded-lg p-5">
          <p className="font-semibold text-lg">Profile Privacy</p>
          <p className="mb-md text-sm text-dark-500 dark:text-dark-400">
            Control who can see your profile and posts.
          </p>
          {loading ? (
            <p className="text-sm text-dark-500 dark:text-dark-400">Loading privacy settings...</p>
          ) : profilePrivacy ? (
            <>
              <div className="flex items-center space-x-md">
                <Button
                  variant={profilePrivacy === ProfilePrivacy.PUBLIC ? 'primary' : 'secondary'}
                  onClick={() => handlePrivacyChange(ProfilePrivacy.PUBLIC)}
                  disabled={profilePrivacy === ProfilePrivacy.PUBLIC}
                >
                  Public
                </Button>
                <Button
                  variant={profilePrivacy === ProfilePrivacy.PRIVATE ? 'primary' : 'secondary'}
                  onClick={() => handlePrivacyChange(ProfilePrivacy.PRIVATE)}
                  disabled={profilePrivacy === ProfilePrivacy.PRIVATE}
                >
                  Private
                </Button>
              </div>
              <p className="mt-sm text-xs text-dark-500 dark:text-dark-400">
                {profilePrivacy === ProfilePrivacy.PRIVATE
                  ? 'Only followers you approve can see your posts.'
                  : 'Anyone can see your posts and profile details.'}
              </p>
            </>
          ) : (
            <p className="text-sm text-red-500">Could not load privacy settings.</p>
          )}
        </div>

        <SettingItem
          icon={<Clock size={20} />}
          title="Notifications"
          description="Login alerts will appear in your notification feed when a new session starts."
          action={
            <Link to="/notifications">
              <Button variant="secondary">Open Notifications</Button>
            </Link>
          }
        />

        <SettingItem
          icon={<FileText size={20} />}
          title="Privacy Policy"
          description="Read our terms and privacy policy to understand how we handle your data."
          action={
            <Link to="/privacy-policy">
              <Button variant="secondary">View Policy</Button>
            </Link>
          }
        />

        <NotificationSettings />

        <SettingItem
          icon={<ShieldCheck size={20} />}
          title="Verification & Trust"
          description="Review your verification status, trust indicators, linked accounts, and document review progress."
          action={
            <Link to="/verification-and-trust">
              <Button variant="secondary">Open Trust</Button>
            </Link>
          }
        />

        <SettingItem
          icon={<ShieldCheck size={20} />}
          title="Account Controls"
          description="Manage account profiles, permissions, data export, and lifecycle state."
          action={
            <Link to="/account-controls">
              <Button variant="secondary">Open Controls</Button>
            </Link>
          }
        />

        <SettingItem
          icon={<Trash2 size={20} />}
          title="Deactivate Account"
          description="Deactivating your account will disable your profile and remove your content from the platform."
          action={
            <Button variant="destructive" onClick={() => setIsDeactivateConfirmOpen(true)}>
              Deactivate
            </Button>
          }
        />

        <SettingItem
          icon={<Trash2 size={20} />}
          title="Delete Account"
          description="Permanently delete your account and all of your content."
          action={
            <Button variant="destructive" onClick={() => setIsDeleteConfirmOpen(true)}>
              Delete Account
            </Button>
          }
        />
      </div>

      <AlertDialog open={isDeactivateConfirmOpen} onOpenChange={setIsDeactivateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate your account. You can reactivate your account by logging in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible and will permanently delete your account and all of your content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}

function SettingItem({ icon, title, description, action }: SettingItemProps) {
  return (
    <div className="surface-soft flex items-center justify-between gap-4 rounded-lg p-5">
      <div className="flex items-start gap-4">
        <div className="mt-1 text-dark-500 dark:text-dark-400">{icon}</div>
        <div>
          <p className="font-semibold text-lg">{title}</p>
          <p className="text-sm text-dark-500 dark:text-dark-400">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export default SettingsPage;