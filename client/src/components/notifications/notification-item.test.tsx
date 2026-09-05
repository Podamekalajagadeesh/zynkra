import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { NotificationItem } from './notification-item';

vi.mock('../../providers/notifications-provider', () => ({
  useNotifications: () => ({
    markAsRead: vi.fn(),
  }),
}));

describe('NotificationItem', () => {
  it('renders system notifications without a sender profile', () => {
    const notification = {
      id: 'notif-1',
      type: 'login_alert',
      read: false,
      createdAt: '2024-01-01T00:00:00Z',
      metadata: { deviceName: 'Chrome on Windows', ipAddress: '203.0.113.42' },
      sender: undefined,
    } as any;

    render(
      <MemoryRouter>
        <NotificationItem notification={notification} />
      </MemoryRouter>
    );

    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText(/signed in from Chrome on Windows/i)).toBeInTheDocument();
  });
});
