export type ThemePreference = 'light' | 'dark';

export type AppIconPreference = 'default' | 'neon' | 'ocean' | 'sunset' | 'creator-classic' | 'creator-vibrant' | 'creator-minimal';

export type LanguagePreference = 'system' | 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja';
export type AutoTranslatePreference = boolean;

export type FeedSortPreference = 'algorithmic' | 'chronological';

export const PREFERENCE_STORAGE_KEYS = {
  theme: 'zynkra_theme',
  appIcon: 'zynkra_app_icon',
  language: 'zynkra_language',
  region: 'zynkra_region',
  keyboardNavigation: 'zynkra_keyboard_navigation',
  autoTranslate: 'zynkra_auto_translate',
  feedSort: 'zynkra_feed_sort',
  dailyScreenTimeLimit: 'zynkra_daily_screen_time_limit',
  screenTimeEnabled: 'zynkra_screen_time_enabled',
  contentWarningsEnabled: 'zynkra_content_warnings_enabled',
  // Accessibility preferences
  highContrastMode: 'zynkra_high_contrast_mode',
  reducedMotion: 'zynkra_reduced_motion',
  screenReaderOptimized: 'zynkra_screen_reader_optimized',
  voiceControlEnabled: 'zynkra_voice_control_enabled',
  largeTextMode: 'zynkra_large_text_mode',
  colorBlindMode: 'zynkra_color_blind_mode',
} as const;

export const APP_ICON_OPTIONS: Array<{ value: AppIconPreference; label: string; description: string; creatorCurated?: boolean }> = [
  { value: 'default', label: 'Default', description: 'Standard Zynkra app icon.' },
  { value: 'neon', label: 'Neon', description: 'Vibrant neon glow style.' },
  { value: 'ocean', label: 'Ocean', description: 'Calming blue wave design.' },
  { value: 'sunset', label: 'Sunset', description: 'Warm orange and pink gradient.' },
  { value: 'creator-classic', label: 'Creator Classic', description: 'Timeless creator-curated design.', creatorCurated: true },
  { value: 'creator-vibrant', label: 'Creator Vibrant', description: 'Bold, colorful creator-curated icon.', creatorCurated: true },
  { value: 'creator-minimal', label: 'Creator Minimal', description: 'Clean minimalist creator-curated design.', creatorCurated: true },
];

export type RegionPreference =
  | 'system'
  | 'US'
  | 'GB'
  | 'CA'
  | 'AU'
  | 'IN'
  | 'JP'
  | 'BR'
  | 'MX'
  | 'ES'
  | 'FR'
  | 'DE';

export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export const COLOR_BLIND_OPTIONS: Array<{ value: ColorBlindMode; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'Standard color display.' },
  { value: 'protanopia', label: 'Protanopia', description: 'Red-green color blindness (red weakness).' },
  { value: 'deuteranopia', label: 'Deuteranopia', description: 'Red-green color blindness (green weakness).' },
  { value: 'tritanopia', label: 'Tritanopia', description: 'Blue-yellow color blindness.' },
  { value: 'achromatopsia', label: 'Achromatopsia', description: 'Complete color blindness (grayscale only).' },
];



export const LANGUAGE_OPTIONS: Array<{ value: LanguagePreference; label: string; description: string }> = [
  { value: 'system', label: 'System default', description: 'Use your browser language.' },
  { value: 'en', label: 'English', description: 'English language formatting.' },
  { value: 'es', label: 'Español', description: 'Spanish language formatting.' },
  { value: 'fr', label: 'Français', description: 'French language formatting.' },
  { value: 'de', label: 'Deutsch', description: 'German language formatting.' },
  { value: 'pt', label: 'Português', description: 'Portuguese language formatting.' },
  { value: 'ja', label: '日本語', description: 'Japanese language formatting.' },
];

export const REGION_OPTIONS: Array<{ value: RegionPreference; label: string; description: string }> = [
  { value: 'system', label: 'System default', description: 'Use your browser region.' },
  { value: 'US', label: 'United States', description: 'MM/DD/YYYY and USD-style defaults.' },
  { value: 'GB', label: 'United Kingdom', description: 'DD/MM/YYYY and GBP-style defaults.' },
  { value: 'CA', label: 'Canada', description: 'Canadian regional formatting.' },
  { value: 'AU', label: 'Australia', description: 'Australian regional formatting.' },
  { value: 'IN', label: 'India', description: 'Indian regional formatting.' },
  { value: 'JP', label: 'Japan', description: 'Japanese regional formatting.' },
  { value: 'BR', label: 'Brazil', description: 'Brazilian regional formatting.' },
  { value: 'MX', label: 'Mexico', description: 'Mexican regional formatting.' },
  { value: 'ES', label: 'Spain', description: 'Spanish regional formatting.' },
  { value: 'FR', label: 'France', description: 'French regional formatting.' },
  { value: 'DE', label: 'Germany', description: 'German regional formatting.' },
];

export function getBrowserLocale() {
  return typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';
}

export function buildLocale(language: LanguagePreference, region: RegionPreference) {
  const browserLocale = getBrowserLocale();
  const [browserLanguage, browserRegion] = browserLocale.split('-');
  const resolvedLanguage = language === 'system' ? browserLanguage : language;
  const resolvedRegion = region === 'system' ? browserRegion : region;

  if (!resolvedRegion) {
    return resolvedLanguage;
  }

  return `${resolvedLanguage}-${resolvedRegion}`;
}

export function getPreferredLocale() {
  if (typeof document !== 'undefined') {
    const locale = document.documentElement.lang?.trim();
    if (locale) {
      return locale;
    }
  }

  return getBrowserLocale();
}

export function formatDateTime(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(getPreferredLocale(), options ?? { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}