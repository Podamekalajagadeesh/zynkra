import { useEffect, useMemo, useState } from 'react';
import { WifiOff, Wifi, Image as ImageIcon, MonitorOff } from 'lucide-react';

interface LowBandwidthMediaProps {
  src: string;
  alt?: string;
  type?: 'image' | 'video' | 'audio';
  className?: string;
  poster?: string;
  controls?: boolean;
  captionsUrl?: string;
  fallbackText?: string;
  forceTextOnly?: boolean;
}

const getConnectionInfo = () => {
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean; downlink?: number } }).connection;
  return {
    effectiveType: connection?.effectiveType || '4g',
    saveData: connection?.saveData || false,
    downlink: connection?.downlink || 4,
  };
};

export function LowBandwidthMedia({
  src,
  alt = 'Media content',
  type = 'image',
  className = '',
  poster,
  controls = false,
  captionsUrl,
  fallbackText = 'This media is hidden because your connection is limited.',
  forceTextOnly = false,
}: LowBandwidthMediaProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [showTextOnly, setShowTextOnly] = useState(false);

  const connection = useMemo(() => getConnectionInfo(), []);

  useEffect(() => {
    if (forceTextOnly) {
      setShowTextOnly(true);
      return;
    }

    const shouldDeferMedia = connection.saveData || connection.downlink <= 1.5 || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
    if (shouldDeferMedia) {
      setShowTextOnly(true);
      return;
    }

    const timer = window.setTimeout(() => setShouldLoad(true), 150);
    return () => window.clearTimeout(timer);
  }, [connection.downlink, connection.effectiveType, connection.saveData, forceTextOnly]);

  if (showTextOnly) {
    return (
      <div className={`rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 ${className}`}>
        <div className="mb-2 flex items-center gap-2">
          {connection.saveData ? <WifiOff size={16} /> : <MonitorOff size={16} />}
          <span className="font-medium">Low-bandwidth mode</span>
        </div>
        <p>{fallbackText}</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Wifi size={12} />
          <span>{connection.effectiveType} • {connection.saveData ? 'data saver' : `${connection.downlink.toFixed(1)} Mbps`}</span>
        </div>
      </div>
    );
  }

  if (!shouldLoad) {
    return (
      <div className={`flex min-h-40 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-400 ${className}`}>
        <div className="flex items-center gap-2">
          <ImageIcon size={16} />
          <span>Preparing media for your connection…</span>
        </div>
      </div>
    );
  }

  if (type === 'video') {
    return (
      <video
        src={src}
        poster={poster}
        controls={controls}
        preload="metadata"
        className={className}
      >
        {captionsUrl && <track src={captionsUrl} kind="captions" srcLang="en" label="English" default />}
      </video>
    );
  }

  if (type === 'audio') {
    return <audio src={src} controls={controls} className={className} />;
  }

  return <img src={src} alt={alt} className={className} loading="lazy" />;
}
