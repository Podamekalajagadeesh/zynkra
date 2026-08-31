import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGenerateRecoveryCodes = vi.fn();
const mockGetTrustedRecoveryContacts = vi.fn();
const mockSetTrustedRecoveryContacts = vi.fn();

vi.mock('../lib/api', () => ({
  generateRecoveryCodes: mockGenerateRecoveryCodes,
  getTrustedRecoveryContacts: mockGetTrustedRecoveryContacts,
  setTrustedRecoveryContacts: mockSetTrustedRecoveryContacts,
}));

describe('RecoveryCodesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateRecoveryCodes.mockResolvedValue({ codes: ['ABCD-EFGH', 'IJKL-MNOP'] });
    mockGetTrustedRecoveryContacts.mockResolvedValue({ contacts: ['backup@example.com'] });
    mockSetTrustedRecoveryContacts.mockResolvedValue({ contacts: ['backup@example.com'], message: 'updated' });
  });

  it('renders recovery codes and trusted contacts setup', async () => {
    const { default: RecoveryCodesPage } = await import('./recovery-codes');

    render(
      <MemoryRouter>
        <RecoveryCodesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /recovery codes/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/trusted recovery contacts/i)).toBeInTheDocument();
  });
});
