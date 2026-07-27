// @ts-nocheck
import { useState } from 'react';
import { useToast } from '../hooks/useToast';
import { post, get } from '../lib/api';
import { Languages, Loader2, ChevronDown } from 'lucide-react';

interface Language {
  code: string;
  name: string;
}

interface MessageTranslatorProps {
  content: string;
  onTranslated?: (translatedText: string) => void;
}

const MessageTranslator: React.FC<MessageTranslatorProps> = ({ content, onTranslated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const { addToast } = useToast();

  const loadLanguages = async () => {
    if (languages.length > 0) return;
    try {
      const langs = await get<Language[]>('/feed/languages');
      setLanguages(langs);
    } catch {
      setLanguages([
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'zh', name: 'Chinese' },
      ]);
    }
  };

  const handleTranslate = async () => {
    setTranslating(true);
    try {
      const result = await post<{ translatedText: string; provider: string }>('/feed/translate', {
        content,
        targetLang: selectedLang,
      });
      setTranslatedText(result.translatedText);
      onTranslated?.(result.translatedText);
    } catch (error) {
      addToast('Translation failed', 'error');
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => { setIsOpen(!isOpen); loadLanguages(); }}
        className="flex items-center gap-1 text-xs text-dark-400 hover:text-primary-500 transition-colors"
        title="Translate message"
      >
        <Languages size={12} />
        Translate
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border p-3 z-50">
          <div className="flex items-center gap-2 mb-2">
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="flex-1 text-sm border rounded-lg px-2 py-1 dark:bg-dark-700 dark:border-dark-600"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
            <button
              onClick={handleTranslate}
              disabled={translating}
              className="px-3 py-1 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {translating ? <Loader2 size={14} className="animate-spin" /> : 'Go'}
            </button>
          </div>

          {translatedText && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-sm">
              {translatedText}
            </div>
          )}

          <button
            onClick={() => setIsOpen(false)}
            className="mt-2 text-xs text-dark-400 hover:text-dark-600"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageTranslator;
