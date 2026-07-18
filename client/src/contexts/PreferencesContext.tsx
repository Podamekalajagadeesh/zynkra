import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  buildLocale,
  LanguagePreference,
  PREFERENCE_STORAGE_KEYS,
  RegionPreference,
  ThemePreference,
  AppIconPreference,
  ColorBlindMode,
  COLOR_BLIND_OPTIONS,
  APP_ICON_OPTIONS,
  LANGUAGE_OPTIONS,
} from '../lib/preferences';

import { FeedSortPreference } from '../lib/preferences';
import { isRtlLanguage, translateTextKey } from '../lib/i18n';

interface PreferencesContextType {
  theme: ThemePreference;
  appIcon: AppIconPreference;
  language: LanguagePreference;
  region: RegionPreference;
  keyboardNavigationEnabled: boolean;
  autoTranslate: boolean;
  feedSort: FeedSortPreference;
  locale: string;
  screenTimeEnabled: boolean;
  dailyScreenTimeLimit: number;
  contentWarningsEnabled: boolean;
  // Accessibility preferences
  highContrastMode: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  voiceControlEnabled: boolean;
  largeTextMode: boolean;
  colorBlindMode: ColorBlindMode;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  setAppIcon: (icon: AppIconPreference) => void;
  setLanguage: (language: LanguagePreference) => void;
  setRegion: (region: RegionPreference) => void;
  setKeyboardNavigationEnabled: (enabled: boolean) => void;
  setAutoTranslate: (enabled: boolean) => void;
  setFeedSort: (sort: FeedSortPreference) => void;
  setScreenTimeEnabled: (enabled: boolean) => void;
  setDailyScreenTimeLimit: (limit: number) => void;
  setContentWarningsEnabled: (enabled: boolean) => void;
  // Accessibility setters
  setHighContrastMode: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setScreenReaderOptimized: (enabled: boolean) => void;
  setVoiceControlEnabled: (enabled: boolean) => void;
  setLargeTextMode: (enabled: boolean) => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function useAppPreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('useAppPreferences must be used within a PreferencesProvider');
  }
  return context;
}

const themeOptions: ThemePreference[] = ['light', 'dark'];
const languageOptions: LanguagePreference[] = LANGUAGE_OPTIONS.map((option) => option.value as LanguagePreference);
const regionOptions: RegionPreference[] = ['system', 'US', 'GB', 'CA', 'AU', 'IN', 'JP', 'BR', 'MX', 'ES', 'FR', 'DE'];

const isEditableElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
};

const readStoredTheme = (): ThemePreference => {
  const storedTheme = localStorage.getItem(PREFERENCE_STORAGE_KEYS.theme);
  return themeOptions.includes(storedTheme as ThemePreference) ? (storedTheme as ThemePreference) : 'light';
};

const readStoredLanguage = (): LanguagePreference => {
  const storedLanguage = localStorage.getItem(PREFERENCE_STORAGE_KEYS.language);
  return languageOptions.includes(storedLanguage as LanguagePreference)
    ? (storedLanguage as LanguagePreference)
    : 'system';
};

const readStoredRegion = (): RegionPreference => {
  const storedRegion = localStorage.getItem(PREFERENCE_STORAGE_KEYS.region);
  return regionOptions.includes(storedRegion as RegionPreference) ? (storedRegion as RegionPreference) : 'system';
};

const readStoredKeyboardNavigation = () => localStorage.getItem(PREFERENCE_STORAGE_KEYS.keyboardNavigation) === 'true';
const readStoredAutoTranslate = (): boolean => {
  const stored = localStorage.getItem(PREFERENCE_STORAGE_KEYS.autoTranslate);
  return stored === null ? true : stored === 'true'; // Default to enabled
};

const readStoredFeedSort = (): FeedSortPreference => {
  const stored = localStorage.getItem(PREFERENCE_STORAGE_KEYS.feedSort);
  return (stored as FeedSortPreference) === 'chronological' ? 'chronological' : 'algorithmic'; // Default to algorithmic
};

const readStoredScreenTimeEnabled = () => localStorage.getItem(PREFERENCE_STORAGE_KEYS.screenTimeEnabled) === 'true';
const readStoredDailyScreenTimeLimit = () => {
  const stored = localStorage.getItem(PREFERENCE_STORAGE_KEYS.dailyScreenTimeLimit);
  return stored ? parseInt(stored, 10) : 120; // Default to 2 hours (120 minutes)
};
const readStoredContentWarningsEnabled = () => {
  const stored = localStorage.getItem(PREFERENCE_STORAGE_KEYS.contentWarningsEnabled);
  return stored === null ? true : stored === 'true'; // Default to enabled
};

// Accessibility preference readers
const readStoredHighContrastMode = () => localStorage.getItem(PREFERENCE_STORAGE_KEYS.highContrastMode) === 'true';
const readStoredReducedMotion = () => localStorage.getItem(PREFERENCE_STORAGE_KEYS.reducedMotion) === 'true';
const readStoredScreenReaderOptimized = () => localStorage.getItem(PREFERENCE_STORAGE_KEYS.screenReaderOptimized) === 'true';
const readStoredVoiceControlEnabled = () => localStorage.getItem(PREFERENCE_STORAGE_KEYS.voiceControlEnabled) === 'true';
const readStoredLargeTextMode = () => localStorage.getItem(PREFERENCE_STORAGE_KEYS.largeTextMode) === 'true';
const readStoredColorBlindMode = (): ColorBlindMode => {
  const stored = localStorage.getItem(PREFERENCE_STORAGE_KEYS.colorBlindMode) as ColorBlindMode;
  return COLOR_BLIND_OPTIONS.find(option => option.value === stored) ? stored : 'none'; // Default to none
};

const readStoredAppIcon = (): AppIconPreference => {
  const stored = localStorage.getItem(PREFERENCE_STORAGE_KEYS.appIcon) as AppIconPreference;
  const validIcons = APP_ICON_OPTIONS.map(option => option.value);
  return validIcons.includes(stored) ? stored : 'default'; // Default to default icon
};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const shortcutPrefixRef = useRef<string | null>(null);
  const shortcutTimeoutRef = useRef<number | null>(null);
  
  // Core state
  const [theme, setThemeState] = useState<ThemePreference>(readStoredTheme());
  const [appIcon, setAppIconState] = useState<AppIconPreference>(readStoredAppIcon());
  const [language, setLanguageState] = useState<LanguagePreference>(readStoredLanguage());
  const [region, setRegionState] = useState<RegionPreference>(readStoredRegion());
  const [keyboardNavigationEnabled, setKeyboardNavigationEnabledState] = useState<boolean>(readStoredKeyboardNavigation());
  const [autoTranslate, setAutoTranslateState] = useState<boolean>(readStoredAutoTranslate());
  const [feedSort, setFeedSortState] = useState<FeedSortPreference>(readStoredFeedSort());
  const [screenTimeEnabled, setScreenTimeEnabledState] = useState<boolean>(readStoredScreenTimeEnabled());
  const [dailyScreenTimeLimit, setDailyScreenTimeLimitState] = useState<number>(readStoredDailyScreenTimeLimit());
  const [contentWarningsEnabled, setContentWarningsEnabledState] = useState<boolean>(readStoredContentWarningsEnabled());
  
  // Accessibility state
  const [highContrastMode, setHighContrastModeState] = useState<boolean>(readStoredHighContrastMode());
  const [reducedMotion, setReducedMotionState] = useState<boolean>(readStoredReducedMotion());
  const [screenReaderOptimized, setScreenReaderOptimizedState] = useState<boolean>(readStoredScreenReaderOptimized());
  const [voiceControlEnabled, setVoiceControlEnabledState] = useState<boolean>(readStoredVoiceControlEnabled());
  const [largeTextMode, setLargeTextModeState] = useState<boolean>(readStoredLargeTextMode());
  const [colorBlindMode, setColorBlindModeState] = useState<ColorBlindMode>(readStoredColorBlindMode());

  // Core setters
  const setTheme = (newTheme: ThemePreference) => setThemeState(newTheme);
  const setAppIcon = (newIcon: AppIconPreference) => setAppIconState(newIcon);
  const setLanguage = (newLanguage: LanguagePreference) => setLanguageState(newLanguage);
  const setRegion = (newRegion: RegionPreference) => setRegionState(newRegion);
  const setKeyboardNavigationEnabled = (enabled: boolean) => setKeyboardNavigationEnabledState(enabled);
  const setAutoTranslate = (enabled: boolean) => setAutoTranslateState(enabled);
  const setFeedSort = (sort: FeedSortPreference) => setFeedSortState(sort);
  const setScreenTimeEnabled = (enabled: boolean) => setScreenTimeEnabledState(enabled);
  const setDailyScreenTimeLimit = (limit: number) => setDailyScreenTimeLimitState(limit);
  const setContentWarningsEnabled = (enabled: boolean) => setContentWarningsEnabledState(enabled);

  // Accessibility setters
  const setHighContrastMode = (enabled: boolean) => setHighContrastModeState(enabled);
  const setReducedMotion = (enabled: boolean) => setReducedMotionState(enabled);
  const setScreenReaderOptimized = (enabled: boolean) => setScreenReaderOptimizedState(enabled);
  const setVoiceControlEnabled = (enabled: boolean) => setVoiceControlEnabledState(enabled);
  const setLargeTextMode = (enabled: boolean) => setLargeTextModeState(enabled);
  const setColorBlindMode = (mode: ColorBlindMode) => setColorBlindModeState(mode);

  // Persist core preferences to localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(PREFERENCE_STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    const locale = buildLocale(language, region);
    const isRtl = isRtlLanguage(language === 'system' ? (navigator.language.split('-')[0] || 'en') : language);
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('data-locale', locale);
    document.documentElement.setAttribute('data-rtl', String(isRtl));
    localStorage.setItem(PREFERENCE_STORAGE_KEYS.language, language);
    localStorage.setItem(PREFERENCE_STORAGE_KEYS.region, region);
  }, [language, region]);

  useEffect(() => {
    localStorage.setItem(PREFERENCE_STORAGE_KEYS.keyboardNavigation, String(keyboardNavigationEnabled));
  }, [keyboardNavigationEnabled]);

  useEffect(() => {
    localStorage.setItem(PREFERENCE_STORAGE_KEYS.autoTranslate, String(autoTranslate));
  }, [autoTranslate]);

  useEffect(() => {
    localStorage.setItem(PREFERENCE_STORAGE_KEYS.feedSort, feedSort);
  }, [feedSort]);

  useEffect(() => {
    localStorage.setItem(PREFERENCE_STORAGE_KEYS.screenTimeEnabled, String(screenTimeEnabled));
  }, [screenTimeEnabled]);

  useEffect(() => {
    localStorage.setItem(PREFERENCE_STORAGE_KEYS.dailyScreenTimeLimit, String(dailyScreenTimeLimit));
  }, [dailyScreenTimeLimit]);

  useEffect(() => {
    localStorage.setItem(PREFERENCE_STORAGE_KEYS.contentWarningsEnabled, String(contentWarningsEnabled));
  }, [contentWarningsEnabled]);

  useEffect(() => {
    localStorage.setItem(PREFERENCE_STORAGE_KEYS.appIcon, appIcon);
  }, [appIcon]);

  // Persist accessibility preferences to localStorage
  useEffect(() => {
    localStorage.setItem(PREFERENCE_STORAGE_KEYS.highContrastMode, String(highContrastMode));
    document.documentElement.setAttribute('data-high-contrast', String(highContrastMode));
  }, [highContrastMode]);

  useEffect(() => {
    localStorage.setItem(PREFERENCE_STORAGE_KEYS.reducedMotion, String(reducedMotion));
    document.documentElement.setAttribute('data-reduced-motion', String(reducedMotion));
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem(PREFERENCE_STORAGE_KEYS.screenReaderOptimized, String(screenReaderOptimized));
    document.documentElement.setAttribute('data-screen-reader', String(screenReaderOptimized));
  }, [screenReaderOptimized]);

  useEffect(() => {
    localStorage.setItem(PREFERENCE_STORAGE_KEYS.voiceControlEnabled, String(voiceControlEnabled));
  }, [voiceControlEnabled]);

  useEffect(() => {
    localStorage.setItem(PREFERENCE_STORAGE_KEYS.largeTextMode, String(largeTextMode));
    document.documentElement.setAttribute('data-large-text', String(largeTextMode));
  }, [largeTextMode]);

  useEffect(() => {
    localStorage.setItem(PREFERENCE_STORAGE_KEYS.colorBlindMode, colorBlindMode);
    document.documentElement.setAttribute('data-color-blind-mode', colorBlindMode);
  }, [colorBlindMode]);

  // Keyboard navigation
  useEffect(() => {
    if (!keyboardNavigationEnabled) {
      shortcutPrefixRef.current = null;
      return;
    }

    const clearShortcutPrefix = () => {
      shortcutPrefixRef.current = null;
      if (shortcutTimeoutRef.current) {
        window.clearTimeout(shortcutTimeoutRef.current);
        shortcutTimeoutRef.current = null;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (isEditableElement(event.target)) {
        return;
      }

      if (event.key === '/') {
        const searchInput = document.getElementById('global-search') as HTMLInputElement | null;
        if (searchInput) {
          event.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      if (event.key.toLowerCase() === 'g') {
        shortcutPrefixRef.current = 'g';
        if (shortcutTimeoutRef.current) {
          window.clearTimeout(shortcutTimeoutRef.current);
        }
        shortcutTimeoutRef.current = window.setTimeout(clearShortcutPrefix, 1500);
        return;
      }

      if (shortcutPrefixRef.current !== 'g') {
        return;
      }

      shortcutPrefixRef.current = null;
      if (shortcutTimeoutRef.current) {
        window.clearTimeout(shortcutTimeoutRef.current);
        shortcutTimeoutRef.current = null;
      }

      switch (event.key.toLowerCase()) {
        case 'h':
          event.preventDefault();
          navigate('/');
          return;
        case 's':
          event.preventDefault();
          navigate('/settings');
          return;
        case 'p':
          event.preventDefault();
          navigate('/profile');
          return;
        case 'd':
          event.preventDefault();
          navigate('/dms');
          return;
        case 'n':
          event.preventDefault();
          navigate('/notifications');
          return;
        default:
          return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearShortcutPrefix();
    };
  }, [keyboardNavigationEnabled, navigate, location.pathname]);

  // Voice control implementation
  useEffect(() => {
    if (!voiceControlEnabled || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      console.log('Voice command received:', command);
      
      // Navigation commands
      if (command.includes('go home') || command.includes('home') || command.includes('open home')) {
        navigate('/');
      } else if (command.includes('settings') || command.includes('go to settings') || command.includes('open settings')) {
        navigate('/settings');
      } else if (command.includes('profile') || command.includes('go to profile') || command.includes('open my profile')) {
        navigate('/profile');
      } else if (command.includes('messages') || command.includes('go to messages') || command.includes('open messages') || command.includes('go to dms')) {
        navigate('/dms');
      } else if (command.includes('notifications') || command.includes('go to notifications') || command.includes('open notifications')) {
        navigate('/notifications');
      } else if (command.includes('search') || command.includes('open search') || command.includes('search for')) {
        const searchInput = document.getElementById('global-search') as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          // If there's a search query after "search for", extract and set it
          const searchMatch = command.match(/search for (.+)/);
          if (searchMatch && searchMatch[1]) {
            searchInput.value = searchMatch[1];
          }
        }
      } else if (command.includes('explore') || command.includes('go to explore') || command.includes('open explore')) {
        navigate('/explore');
      } else if (command.includes('login') || command.includes('go to login') || command.includes('open login')) {
        navigate('/login');
      } else if (command.includes('back') || command.includes('go back') || command.includes('previous page')) {
        window.history.back();
      } else if (command.includes('forward') || command.includes('next page') || command.includes('go forward')) {
        window.history.forward();
      } else if (command.includes('refresh') || command.includes('reload page') || command.includes('refresh page')) {
        window.location.reload();
      } else if (command.includes('scroll up') || command.includes('move up')) {
        window.scrollBy({ top: -200, behavior: 'smooth' });
      } else if (command.includes('scroll down') || command.includes('move down')) {
        window.scrollBy({ top: 200, behavior: 'smooth' });
      } else if (command.includes('scroll to top') || command.includes('go to top')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (command.includes('scroll to bottom') || command.includes('go to bottom')) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      } else if (command.includes('click') || command.includes('select') || command.includes('activate')) {
        // Try to find and click a button or link with text matching the command
        const elements = document.querySelectorAll('button, a, [role="button"]');
        for (const element of elements) {
          const text = element.textContent?.toLowerCase() || '';
          if (text && command.includes(text)) {
            (element as HTMLElement).click();
            break;
          }
        }
      }
    };

    recognition.start();
    return () => recognition.stop();
  }, [voiceControlEnabled, navigate]);

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorage = () => {
      setThemeState(readStoredTheme());
      setLanguageState(readStoredLanguage());
      setRegionState(readStoredRegion());
      setKeyboardNavigationEnabledState(readStoredKeyboardNavigation());
      setScreenTimeEnabledState(readStoredScreenTimeEnabled());
      setDailyScreenTimeLimitState(readStoredDailyScreenTimeLimit());
      setContentWarningsEnabledState(readStoredContentWarningsEnabled());
      // Update accessibility preferences on storage change
      setHighContrastModeState(readStoredHighContrastMode());
      setReducedMotionState(readStoredReducedMotion());
      setScreenReaderOptimizedState(readStoredScreenReaderOptimized());
      setVoiceControlEnabledState(readStoredVoiceControlEnabled());
      setLargeTextModeState(readStoredLargeTextMode());
      setColorBlindModeState(readStoredColorBlindMode());
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value: PreferencesContextType = {
    theme,
    language,
    region,
    keyboardNavigationEnabled,
    autoTranslate,
    feedSort,
    locale: buildLocale(language, region),
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
    setTheme,
    toggleTheme: () => setThemeState((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light')),
    setLanguage,
    setRegion,
    setKeyboardNavigationEnabled,
    setAutoTranslate,
    setFeedSort,
    setScreenTimeEnabled,
    setDailyScreenTimeLimit,
    setContentWarningsEnabled,
    // Accessibility setters
    setHighContrastMode,
    setReducedMotion,
    setScreenReaderOptimized,
    setVoiceControlEnabled,
    setLargeTextMode,
    setColorBlindMode,
  };

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}