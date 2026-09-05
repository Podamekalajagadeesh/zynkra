import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockGetAccountDashboard = vi.fn();
const mockGetSecurityCenter = vi.fn();
const mockGetVerificationStatus = vi.fn();

vi.mock('../lib/api', () => ({
  getAccountDashboard: mockGetAccountDashboard,
  getSecurityCenter: mockGetSecurityCenter,
  getVerificationStatus: mockGetVerificationStatus,
}));

describe('AccountDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAccountDashboard.mockResolvedValue({
      account: { accountId: 'user-1', deactivated: false, switchingEnabled: true },
      preferences: { theme: 'dark', language: 'en-US', timezone: 'UTC' },
      notifications: { emailDigest: true, pushAlerts: true, securityAlerts: true },
      linkedAccounts: [],
      history: [],
      privacy: { showOnlineStatus: true, readReceipts: true },
      recoveryStatus: null,
      appeals: [],
      securityCenter: {
        accountId: 'user-1',
        exportUrl: '/security-log',
        logs: [],
        connectedAccounts: [],
        trustedDevices: [],
        recoveryStatus: null,
        pendingAppeals: [],
        securityAlerts: [],
        pendingApprovals: [],
      },
    });
    mockGetSecurityCenter.mockResolvedValue({
      accountId: 'user-1',
      exportUrl: '/security-log',
      logs: [],
      connectedAccounts: [],
      trustedDevices: [],
      recoveryStatus: null,
      pendingAppeals: [],
      securityAlerts: [],
      pendingApprovals: [],
    });
    mockGetVerificationStatus.mockResolvedValue({
      accountId: 'user-1',
      verified: false,
      status: 'not_started',
      type: 'identity',
      appeals: [],
    });
  });

  it('renders the account dashboard and security overview', async () => {
    const { default: AccountDashboardPage } = await import('./account-dashboard');

    render(
      <MemoryRouter>
        <AccountDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/account dashboard/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/security center/i)).toBeInTheDocument();
    expect(screen.getByText(/identity verification/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start account recovery/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request verification/i })).toBeInTheDocument();
  });
});
