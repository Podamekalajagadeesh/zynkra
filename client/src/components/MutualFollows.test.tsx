import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MutualFollows } from './MutualFollows';

const mockGetMutualFollows = vi.fn();

vi.mock('../lib/api', () => ({
  getMutualFollows: (...args: any[]) => mockGetMutualFollows(...args),
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('MutualFollows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockGetMutualFollows.mockResolvedValue([]);
    renderWithRouter(<MutualFollows userId="user-1" />);
    expect(screen.getByText('Loading mutual follows...')).toBeInTheDocument();
  });

  it('renders mutual follows after loading', async () => {
    mockGetMutualFollows.mockResolvedValue([
      { id: 'mutual-1', email: 'alice@example.com', nftPfpUrl: null },
      { id: 'mutual-2', email: 'bob@example.com', nftPfpUrl: null },
    ]);

    renderWithRouter(<MutualFollows userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText('Followed by')).toBeInTheDocument();
    });

    expect(screen.getByText('a')).toBeInTheDocument(); // First letter of alice@example.com
    expect(screen.getByText('b')).toBeInTheDocument(); // First letter of bob@example.com
  });

  it('renders nothing when no mutual follows', async () => {
    mockGetMutualFollows.mockResolvedValue([]);
    const { container } = renderWithRouter(<MutualFollows userId="user-1" />);

    await waitFor(() => {
      expect(screen.queryByText('Loading mutual follows...')).not.toBeInTheDocument();
    });

    expect(container.innerHTML).toBe('');
  });

  it('displays +X more when more than 5 mutuals', async () => {
    mockGetMutualFollows.mockResolvedValue([
      { id: 'mutual-1', email: 'a@test.com', nftPfpUrl: null },
      { id: 'mutual-2', email: 'b@test.com', nftPfpUrl: null },
      { id: 'mutual-3', email: 'c@test.com', nftPfpUrl: null },
      { id: 'mutual-4', email: 'd@test.com', nftPfpUrl: null },
      { id: 'mutual-5', email: 'e@test.com', nftPfpUrl: null },
      { id: 'mutual-6', email: 'f@test.com', nftPfpUrl: null },
      { id: 'mutual-7', email: 'g@test.com', nftPfpUrl: null },
    ]);

    renderWithRouter(<MutualFollows userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText('+ 2 more')).toBeInTheDocument();
    });
  });

  it('renders links to user profiles', async () => {
    mockGetMutualFollows.mockResolvedValue([
      { id: 'mutual-1', email: 'alice@test.com', nftPfpUrl: null },
    ]);

    renderWithRouter(<MutualFollows userId="user-1" />);

    await waitFor(() => {
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/profile/mutual-1');
    });
  });

  it('handles API error gracefully', async () => {
    mockGetMutualFollows.mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithRouter(<MutualFollows userId="user-1" />);

    await waitFor(() => {
      expect(screen.queryByText('Loading mutual follows...')).not.toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch mutual follows:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
