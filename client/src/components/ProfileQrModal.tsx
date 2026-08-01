import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, X } from 'lucide-react';
import { Button } from './ui/button';

interface ProfileQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Profile username used in the URL (falls back to user id). */
  profileId: string;
  displayName?: string | null;
}

/** QR code that links to the user's profile — scan to follow. */
export function ProfileQrModal({ isOpen, onClose, profileId, displayName }: ProfileQrModalProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const profileUrl = `${window.location.origin}/profile/${profileId}`;

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(profileUrl, { width: 480, margin: 2 })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [isOpen, profileUrl]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-lg dark:bg-dark-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold mb-1">
          {displayName ? `${displayName}'s profile` : 'Profile QR code'}
        </h2>
        <p className="text-sm text-dark-500 mb-4">Scan to open this profile</p>

        {dataUrl ? (
          <img
            src={dataUrl}
            alt="Profile QR code"
            className="mx-auto w-60 h-60 rounded-xl border border-dark-200 dark:border-dark-700"
          />
        ) : (
          <div className="mx-auto w-60 h-60 rounded-xl bg-dark-100 animate-pulse dark:bg-dark-700" />
        )}

        <p className="mt-3 break-all text-xs text-dark-500">{profileUrl}</p>

        <div className="mt-4 flex justify-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              navigator.clipboard.writeText(profileUrl);
            }}
          >
            Copy link
          </Button>
          {dataUrl && (
            <a href={dataUrl} download="profile-qr.png">
              <Button icon={<Download size={16} />}>Download</Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
