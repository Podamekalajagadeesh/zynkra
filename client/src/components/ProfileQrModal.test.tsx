import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProfileQrModal } from './ProfileQrModal';

// Mock qrcode so QR generation resolves synchronously in tests
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mocked-qr'),
  },
}));

describe('ProfileQrModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    profileId: 'user-1',
    displayName: 'Test User',
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ProfileQrModal {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the modal when isOpen is true', () => {
    render(<ProfileQrModal {...defaultProps} />);
    expect(screen.getByText(/test user's profile/i)).toBeInTheDocument();
    expect(screen.getByText(/scan to open/i)).toBeInTheDocument();
  });

  it('shows display name in title', () => {
    render(<ProfileQrModal {...defaultProps} displayName="Alice" />);
    expect(screen.getByText(/alice's profile/i)).toBeInTheDocument();
  });

  it('shows fallback title when no displayName', () => {
    render(<ProfileQrModal {...defaultProps} displayName={undefined} />);
    expect(screen.getByText(/profile qr code/i)).toBeInTheDocument();
  });

  it('displays the profile URL', () => {
    render(<ProfileQrModal {...defaultProps} />);
    expect(screen.getByText(/users\/user-1/)).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<ProfileQrModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<ProfileQrModal {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<ProfileQrModal {...defaultProps} onClose={onClose} />);
    // Click the backdrop (parent overlay)
    const backdrop = screen.getByText(/scan to open/i).closest('div')?.parentElement;
    if (backdrop) await user.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders copy link button', () => {
    render(<ProfileQrModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
  });

  it('renders download button after QR code generates', async () => {
    render(<ProfileQrModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });
  });

  it('renders QR image after generation', async () => {
    render(<ProfileQrModal {...defaultProps} />);

    await waitFor(() => {
      const img = screen.getByAltText(/profile qr code/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'data:image/png;base64,mocked-qr');
    });
  });
});
