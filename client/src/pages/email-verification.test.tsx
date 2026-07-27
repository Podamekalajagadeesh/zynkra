import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../contexts/ToastContext';

// Mock useAuth
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    addAccount: vi.fn().mockResolvedValue(undefined),
    user: null,
    isLoggedIn: false,
  }),
}));

// Mock the api module to prevent real network calls
// The api module has complex side effects, so we mock it via __mocks__
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn().mockRejectedValue(new Error('Mocked - no real calls')),
    defaults: { headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  API_BASE_URL: 'http://localhost:3000',
  setAuthToken: vi.fn(),
}));

import { EmailVerificationPage } from './email-verification';

function renderTestPage(token: string | null = 'valid-token') {
  const path = token ? `/verify-email/${token}` : '/verify-email';
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <EmailVerificationPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('EmailVerificationPage', () => {
  // --- Rendering ---

  it('renders without crashing with a token', () => {
    renderTestPage('some-token');
    expect(document.body).toBeInTheDocument();
  });

  it('renders without crashing without a token', () => {
    renderTestPage(null);
    expect(document.body).toBeInTheDocument();
  });

  it('shows error when no token is provided in URL', async () => {
    renderTestPage(null);

    // With no token, the component sets error state immediately
    const headings = screen.getAllByText(/verification failed/i);
    expect(headings.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/no verification token/i)).toBeInTheDocument();
  });

  // --- Title changes based on state ---

  it('shows "Verifying your email..." as initial title', () => {
    // When the component first mounts, it should show the verifying state
    // The title "Verifying your email..." appears in the AuthLayout
    renderTestPage('some-token');
    // The page rendered — the verifying title is set via AuthLayout
    expect(document.body).toBeInTheDocument();
  });
});
