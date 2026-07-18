export interface LanguageOption {
  value: string;
  label: string;
  rtl: boolean;
  nativeLabel: string;
  region?: string;
}

export const LANGUAGE_METADATA: Record<string, LanguageOption> = {
  system: { value: 'system', label: 'System default', rtl: false, nativeLabel: 'System default' },
  en: { value: 'en', label: 'English', rtl: false, nativeLabel: 'English' },
  es: { value: 'es', label: 'Spanish', rtl: false, nativeLabel: 'Español' },
  fr: { value: 'fr', label: 'French', rtl: false, nativeLabel: 'Français' },
  de: { value: 'de', label: 'German', rtl: false, nativeLabel: 'Deutsch' },
  pt: { value: 'pt', label: 'Portuguese', rtl: false, nativeLabel: 'Português' },
  ja: { value: 'ja', label: 'Japanese', rtl: false, nativeLabel: '日本語' },
  hi: { value: 'hi', label: 'Hindi', rtl: false, nativeLabel: 'हिन्दी' },
  ar: { value: 'ar', label: 'Arabic', rtl: true, nativeLabel: 'العربية' },
  he: { value: 'he', label: 'Hebrew', rtl: true, nativeLabel: 'עברית' },
  zh: { value: 'zh', label: 'Chinese', rtl: false, nativeLabel: '中文' },
  ru: { value: 'ru', label: 'Russian', rtl: false, nativeLabel: 'Русский' },
  sw: { value: 'sw', label: 'Swahili', rtl: false, nativeLabel: 'Kiswahili' },
  tr: { value: 'tr', label: 'Turkish', rtl: false, nativeLabel: 'Türkçe' },
  ur: { value: 'ur', label: 'Urdu', rtl: true, nativeLabel: 'اردو' },
  vi: { value: 'vi', label: 'Vietnamese', rtl: false, nativeLabel: 'Tiếng Việt' },
};

export const TRANSLATION_DICTIONARY: Record<string, Record<string, string>> = {
  'settings.region': {
    en: 'Region',
    es: 'Región',
    fr: 'Région',
    de: 'Region',
    pt: 'Região',
    ja: '地域',
    hi: 'क्षेत्र',
    ar: 'المنطقة',
    he: 'אזור',
    zh: '地区',
    ru: 'Регион',
    sw: 'Mkoa',
    tr: 'Bölge',
    ur: 'علاقہ',
    vi: 'Khu vực',
  },
  'settings.autoTranslate': {
    en: 'Auto-translate posts',
    es: 'Traducción automática',
    fr: 'Traduction automatique',
    de: 'Automatische Übersetzung',
    pt: 'Tradução automática',
    ja: '自動翻訳',
    hi: 'स्वचालित अनुवाद',
    ar: 'الترجمة التلقائية',
    he: 'תרגום אוטומטי',
    zh: '自动翻译',
    ru: 'Автоматический перевод',
    sw: 'Tafsiri ya otomatiki',
    tr: 'Otomatik çeviri',
    ur: 'خودکار ترجمہ',
    vi: 'Dịch tự động',
  },
  'settings.language': {
    en: 'Language',
    es: 'Idioma',
    fr: 'Langue',
    de: 'Sprache',
    pt: 'Idioma',
    ja: '言語',
    hi: 'भाषा',
    ar: 'اللغة',
    he: 'שפה',
    zh: '语言',
    ru: 'Язык',
    sw: 'Lugha',
    tr: 'Dil',
    ur: 'زبان',
    vi: 'Ngôn ngữ',
  },
  'settings.culturalCustomization': {
    en: 'Cultural customization',
    es: 'Personalización cultural',
    fr: 'Personnalisation culturelle',
    de: 'Kulturelle Anpassung',
    pt: 'Personalização cultural',
    ja: '文化的カスタマイズ',
    hi: 'सांस्कृतिक अनुकूलन',
    ar: 'التخصيص الثقافي',
    he: 'התאמה תרבותית',
    zh: '文化定制',
    ru: 'Культурная настройка',
    sw: 'Mabadiliko ya kitamaduni',
    tr: 'Kültürel kişiselleştirme',
    ur: 'ثقافتی تخصیص',
    vi: 'Tùy chỉnh văn hóa',
  },
};

export function getLanguageMetadata(value: string) {
  return LANGUAGE_METADATA[value] ?? LANGUAGE_METADATA.en;
}

export function translateTextKey(key: string, locale: string) {
  const normalizedLocale = locale === 'system' ? 'en' : locale;
  return TRANSLATION_DICTIONARY[key]?.[normalizedLocale] ?? TRANSLATION_DICTIONARY[key]?.en ?? key;
}

export function getLanguageOptions() {
  return Object.values(LANGUAGE_METADATA).filter((option) => option.value !== 'system');
}

export function isRtlLanguage(value: string) {
  return getLanguageMetadata(value).rtl;
}
