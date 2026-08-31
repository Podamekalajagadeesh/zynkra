import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../contexts/ToastContext';
import { PasskeyManagementPage } from './passkey-management';

const { getPasskeys, deletePasskey } = vi.hoisted(() => ({
  getPasskeys: vi.fn(),
  deletePasskey: vi.fn(),
}));

vi.mock('../lib/api', () => ({
  getPasskeys,
  deletePasskey,
}));

vi.mock('../components/WebAuthn', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

describe('PasskeyManagementPage', () => {
  beforeEach(() => {
    getPasskeys.mockResolvedValue([]);
    deletePasskey.mockResolvedValue({});
  });

  it('offers passkey registration from the authenticated management page', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <PasskeyManagementPage />
        </ToastProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Add Passkey' })).toBeInTheDocument();
    await waitFor(() => expect(getPasskeys).toHaveBeenCalled());
  });
});
