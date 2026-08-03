import React from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import type { LinkPreviewData } from '../hooks/useLinkPreview';

export function LinkPreviewCard({
  preview,
  loading,
}: {
  preview: LinkPreviewData | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Fetching link preview...
      </div>
    );
  }

  if (!preview || (!preview.title && !preview.description && !preview.image)) {
    return null;
  }

  let hostname = '';
  try {
    hostname = new URL(preview.url).hostname;
  } catch {
    hostname = preview.url;
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex gap-3 overflow-hidden rounded-xl border border-dark-200 bg-white/80 p-3 transition-colors hover:border-primary-300 dark:bg-dark-800"
    >
      {preview.image && (
        <img
          src={preview.image}
          alt=""
          className="h-24 w-24 shrink-0 rounded-lg object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-semibold">{preview.title || preview.url}</p>
        {preview.description && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">{preview.description}</p>
        )}
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-400">
          <ExternalLink className="h-3 w-3" />
          {preview.siteName || hostname}
        </p>
      </div>
    </a>
  );
}
