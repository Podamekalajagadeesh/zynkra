import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockGetSecurityLogs = vi.fn();

vi.mock('../lib/api', () => ({
  getSecurityLogs: mockGetSecurityLogs,
}));

describe('SecurityLogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSecurityLogs.mockResolvedValue({
      logs: [
        {
          id: 'log-1',
          eventType: 'login_success',
          severity: 'high',
          message: 'Signed in from Chrome on Windows',
          ipAddress: '203.0.113.42',
          userAgent: 'Mozilla/5.0',
          createdAt: '2024-01-15T12:00:00.000Z',
        },
      ],
      total: 1,
    });
  });

  it('renders persisted security log entries for the user', async () => {
    const { default: SecurityLogsPage } = await import('./security-logs');

    render(
      <MemoryRouter>
        <SecurityLogsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/security logs/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/signed in from chrome on windows/i)).toBeInTheDocument();
    expect(screen.getByText(/203\.0\.113\.42/i)).toBeInTheDocument();
  });
});
