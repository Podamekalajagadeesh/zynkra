/**
 * Settings → E2EE recovery backup UI: passphrase validation, export
 * (Blob download), and import (file → service → reload). The crypto and
 * the store behind these buttons are covered by
 * e2ee.service.rotation-recovery.test.ts; this pins the interaction layer.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { E2eeRecoverySettings } from './e2ee-recovery-settings';

const mocks = vi.hoisted(() => ({
  isReady: true,
  error: null as string | null,
  exportRecovery: vi.fn(),
  importRecovery: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  reload: vi.fn(),
}));

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({ user: { id: 'u1' } }),
}));

vi.mock('../hooks/useE2EE', () => ({
  useE2EE: () => ({
    isReady: mocks.isReady,
    isInitializing: false,
    error: mocks.error,
    exportRecovery: mocks.exportRecovery,
    importRecovery: mocks.importRecovery,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mocks.toastError(...args),
    success: (...args: unknown[]) => mocks.toastSuccess(...args),
  },
}));

const PASSPHRASE = 'correct horse battery staple';

/** jsdom's File predates Blob.text() — the component reads the file via text(). */
function makeFile(content: string): File {
  const file = new File([content], 'backup.zkebackup', { type: 'application/json' });
  Object.defineProperty(file, 'text', { value: async () => content });
  return file;
}

function setPassphrases(passphrase: string, confirm: string) {
  fireEvent.change(screen.getByPlaceholderText('At least 8 characters'), {
    target: { value: passphrase },
  });
  fireEvent.change(screen.getByPlaceholderText('Confirm passphrase (export only)'), {
    target: { value: confirm },
  });
}

describe('E2eeRecoverySettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isReady = true;
    mocks.error = null;
    URL.createObjectURL = vi.fn(() => 'blob:zynkra-test') as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: mocks.reload },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects an export with a too-short passphrase', async () => {
    render(<E2eeRecoverySettings />);
    setPassphrases('short', 'short');

    fireEvent.click(screen.getByRole('button', { name: /export backup/i }));

    expect(mocks.toastError).toHaveBeenCalledWith('Passphrase must be at least 8 characters');
    expect(mocks.exportRecovery).not.toHaveBeenCalled();
  });

  it('rejects an export when the confirmation does not match', async () => {
    render(<E2eeRecoverySettings />);
    setPassphrases(PASSPHRASE, `${PASSPHRASE}!`);

    fireEvent.click(screen.getByRole('button', { name: /export backup/i }));

    expect(mocks.toastError).toHaveBeenCalledWith('Passphrases do not match');
    expect(mocks.exportRecovery).not.toHaveBeenCalled();
  });

  it('exports a downloadable backup and clears the confirmation field', async () => {
    mocks.exportRecovery.mockResolvedValue('{"envelope":true}');
    render(<E2eeRecoverySettings />);
    setPassphrases(PASSPHRASE, PASSPHRASE);

    fireEvent.click(screen.getByRole('button', { name: /export backup/i }));

    await waitFor(() => expect(mocks.exportRecovery).toHaveBeenCalledWith(PASSPHRASE));
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:zynkra-test');
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      'Recovery backup downloaded — store it somewhere safe.'
    );
    const confirmInput = screen.getByPlaceholderText(
      'Confirm passphrase (export only)'
    ) as HTMLInputElement;
    await waitFor(() => expect(confirmInput.value).toBe(''));
  });

  it('surfaces an export failure from the service', async () => {
    mocks.exportRecovery.mockRejectedValue(new Error('WebCrypto is unavailable'));
    render(<E2eeRecoverySettings />);
    setPassphrases(PASSPHRASE, PASSPHRASE);

    fireEvent.click(screen.getByRole('button', { name: /export backup/i }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith('WebCrypto is unavailable'));
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it('rejects an import with a too-short passphrase', async () => {
    render(<E2eeRecoverySettings />);
    setPassphrases('short', '');

    const fileInput = document.querySelector('input[type="file"]')!;
    fireEvent.change(fileInput, {
      target: { files: [makeFile('{}')] },
    });

    expect(mocks.toastError).toHaveBeenCalledWith('Passphrase must be at least 8 characters');
    expect(mocks.importRecovery).not.toHaveBeenCalled();
  });

  it('imports a backup file and reloads to finish setup', async () => {
    mocks.importRecovery.mockResolvedValue(undefined);
    render(<E2eeRecoverySettings />);
    setPassphrases(PASSPHRASE, '');

    const fileInput = document.querySelector('input[type="file"]')!;
    fireEvent.change(fileInput, {
      target: { files: [makeFile('{"userId":"u1"}')] },
    });

    await waitFor(() =>
      expect(mocks.importRecovery).toHaveBeenCalledWith('{"userId":"u1"}', PASSPHRASE)
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Backup restored — reloading to finish setup…');

    await waitFor(() => expect(mocks.reload).toHaveBeenCalled(), { timeout: 3000 });
  }, 10_000);

  it('surfaces an import failure from the service', async () => {
    mocks.importRecovery.mockRejectedValue(
      new Error('This backup belongs to a different account. Sign in as that account first.')
    );
    render(<E2eeRecoverySettings />);
    setPassphrases(PASSPHRASE, '');

    const fileInput = document.querySelector('input[type="file"]')!;
    fireEvent.change(fileInput, {
      target: { files: [makeFile('{}')] },
    });

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalled());
    expect(String(mocks.toastError.mock.calls[0][0])).toMatch(/different account/);
    expect(mocks.reload).not.toHaveBeenCalled();
  });

  it('disables both actions and explains while E2EE is unavailable', () => {
    mocks.isReady = false;
    mocks.error = 'keys failed to load';
    render(<E2eeRecoverySettings />);

    expect(screen.getByText(/E2EE unavailable: keys failed to load/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /export backup/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /restore from backup/i })).toBeDisabled();
  });
});
