import { useEffect, useState } from 'react';
import { getLinkPreview } from '../lib/api';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export interface LinkPreviewData {
  url: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  siteName?: string | null;
  favicon?: string | null;
}

export function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[0].replace(/[),.!?;:]+$/, '') : null;
}

export function useLinkPreview(text: string, enabled = true) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const url = extractFirstUrl(text);
    if (!url) {
      setPreview(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        setPreview(await getLinkPreview(url));
      } catch {
        setPreview(null);
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [text, enabled]);

  return { preview, loading };
}
