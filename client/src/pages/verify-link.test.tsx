import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { mockAddAccount } = vi.hoisted(() => ({ mockAddAccount: vi.fn() }));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ addAccount: mockAddAccount }),
}));

vi.mock('../lib/api', () => ({
  verifyMagicLink: vi.fn(),
  setAuthToken: vi.fn(),
  getProfile: vi.fn(),
}));

import { VerifyLinkPage } from './verify-link';
import { verifyMagicLink, getProfile } from '../lib/api';

function renderPage(token: string | null = 'valid-token') {
  const path = token ? `/verify-link?token=${token}` : '/verify-link';
  return render(
    <MemoryRouter initialEntries={[path]}>
      <VerifyLinkPage />
    </MemoryRouter>
  );
}

describe('VerifyLinkPage', () => {
  beforeEach(() => {
    mockAddAccount.mockReset();
    vi.mocked(verifyMagicLink).mockReset();
    vi.mocked(getProfile).mockReset();
  });

  it('shows an error when no token is in the URL', async () => {
    renderPage(null);

    await waitFor(() => {
      const headings = screen.getAllByText(/link invalid or expired/i);
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText(/no sign-in link found/i)).toBeInTheDocument();
  });

  it('verifies the magic link and signs the user in on success', async () => {
    mockAddAccount.mockResolvedValue(undefined);
    vi.mocked(verifyMagicLink).mockResolvedValue({ access_token: 'mock-jwt-token' });
    vi.mocked(getProfile).mockResolvedValue({ id: 'user-1', username: 'testuser' } as any);

    renderPage('valid-token');

    await waitFor(() => {
      expect(mockAddAccount).toHaveBeenCalled();
    });
    expect(verifyMagicLink).toHaveBeenCalledWith({ token: 'valid-token' });
    expect(mockAddAccount).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'mock-jwt-token' }),
    );
  });

  it('shows an error state for an invalid or expired link', async () => {
    vi.mocked(verifyMagicLink).mockRejectedValue({
      response: { data: { message: 'This sign-in link is invalid or has expired.' } },
    });

    renderPage('expired-token');

    await waitFor(() => {
      expect(screen.getByText(/this sign-in link is invalid or has expired/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
    expect(mockAddAccount).not.toHaveBeenCalled();
  });
});
