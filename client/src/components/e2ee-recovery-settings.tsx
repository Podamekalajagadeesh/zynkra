/**
 * Settings → E2EE recovery backup (export / import).
 *
 * The recovery half of the E2EE story: a passphrase-encrypted download of the
 * device's full key state (identity + session ratchet + pre-keys), and the
 * restore flow for a new device. The passphrase is typed here, used for
 * PBKDF2 locally, and never transmitted — there is no server-side escrow.
 */
import { useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Download, KeyRound, ShieldCheck, Upload } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { useE2EE } from '../hooks/useE2EE';

const MIN_PASSPHRASE_LENGTH = 8;

export function E2eeRecoverySettings() {
  const { user } = useUser();
  const { isReady, error, exportRecovery, importRecovery } = useE2EE(user?.id);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const passphraseError = (): string | null => {
    if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
      return `Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters`;
    }
    return null;
  };

  const handleExport = async () => {
    const err = passphraseError();
    if (err) {
      toast.error(err);
      return;
    }
    if (passphrase !== confirmPassphrase) {
      toast.error('Passphrases do not match');
      return;
    }
    setBusy('export');
    try {
      const envelope = await exportRecovery(passphrase);
      const blob = new Blob([envelope], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zynkra-e2ee-recovery-${new Date().toISOString().slice(0, 10)}.zkebackup`;
      link.click();
      URL.revokeObjectURL(url);
      setConfirmPassphrase('');
      toast.success('Recovery backup downloaded — store it somewhere safe.');
    } catch (error_) {
      toast.error(
        error_ instanceof Error ? error_.message : 'Backup export failed',
      );
    } finally {
      setBusy(null);
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const err = passphraseError();
    if (err) {
      toast.error(err);
      return;
    }
    setBusy('import');
    try {
      const envelopeText = await file.text();
      await importRecovery(envelopeText, passphrase);
      toast.success('Backup restored — reloading to finish setup…');
      setTimeout(() => window.location.reload(), 1200);
    } catch (error_) {
      toast.error(
        error_ instanceof Error ? error_.message : 'Backup import failed',
      );
      setBusy(null);
    }
  };

  return (
    <div className="surface-soft rounded-2xl p-5">
      <div className="mb-4 flex items-start gap-3">
        <ShieldCheck size={20} className="mt-0.5 text-emerald-600" />
        <div>
          <p className="font-semibold text-lg">Encryption key recovery</p>
          <p className="text-sm text-dark-500 dark:text-dark-400">
            Direct messages are end-to-end encrypted — this device holds the only
            copy of your private keys and session state. Export a
            passphrase-encrypted backup before switching devices or clearing
            browser data. The passphrase never leaves this device; if you lose
            it, the backup cannot be opened by anyone, including us.
          </p>
        </div>
      </div>

      {!isReady && (
        <p className="mb-3 text-xs text-dark-500 dark:text-dark-400">
          {error
            ? `E2EE unavailable: ${error}`
            : 'Initializing encryption… retry after it completes.'}
        </p>
      )}

      <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
        <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
          <KeyRound size={16} />
          Backup passphrase
        </div>
        <input
          type="password"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm text-dark-900 shadow-sm outline-none transition focus:border-primary-500 dark:border-dark-700 dark:bg-dark-900 dark:text-white"
        />
        <input
          type="password"
          value={confirmPassphrase}
          onChange={(event) => setConfirmPassphrase(event.target.value)}
          placeholder="Confirm passphrase (export only)"
          autoComplete="new-password"
          className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm text-dark-900 shadow-sm outline-none transition focus:border-primary-500 dark:border-dark-700 dark:bg-dark-900 dark:text-white"
        />

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={!isReady || busy !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            {busy === 'export' ? 'Encrypting…' : 'Export backup'}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isReady || busy !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-dark-300 px-4 py-2.5 text-sm font-semibold text-dark-700 transition hover:bg-dark-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:text-dark-200 dark:hover:bg-dark-800"
          >
            <Upload size={16} />
            {busy === 'import' ? 'Restoring…' : 'Restore from backup'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zkebackup,application/json"
            className="hidden"
            onChange={(event) => void handleImportFile(event)}
          />
        </div>

        <p className="text-xs text-dark-500 dark:text-dark-400">
          Restoring replaces this device's encryption keys and session history
          with the backup's, and keeps the same identity — contacts never see a
          safety-number change.
        </p>
      </div>
    </div>
  );
}
