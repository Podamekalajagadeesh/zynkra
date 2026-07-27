// @ts-nocheck
/**
 * useTranslation — React hook for internationalization.
 */
import { useState, useCallback, useEffect } from 'react';
import { t as translate, setLocale, loadSavedLocale, getCurrentLocale, type Locale } from '../lib/i18n';

interface UseTranslationReturn {
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isRTL: boolean;
}

const RTL_LOCALES: Locale[] = ['ar'];

export function useTranslation(): UseTranslationReturn {
  const [locale, setLocaleState] = useState<Locale>(() => loadSavedLocale());

  useEffect(() => {
    loadSavedLocale();
  }, []);

  const handleSetLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocale(newLocale);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = RTL_LOCALES.includes(newLocale) ? 'rtl' : 'ltr';
  }, []);

  const isRTL = RTL_LOCALES.includes(locale);

  return {
    t: translate,
    locale,
    setLocale: handleSetLocale,
    isRTL,
  };
}
