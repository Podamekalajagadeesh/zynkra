import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../contexts/ToastContext';

// Mock useAuth
const mockSetCurrentUser = vi.fn();
const mockUser = {
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  bio: 'A test bio',
  avatar: '/avatar.jpg',
  email: 'test@example.com',
  followers: [],
  profilePrivacy: 'public',
  verified: false,
};

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    setUser: mockSetCurrentUser,
    isLoggedIn: true,
  }),
}));

// Mock API functions
const mockGetProfile = vi.fn();
const mockGetUserProfile = vi.fn();
const mockGetReputation = vi.fn();
const mockGetMutualFollows = vi.fn();
vi.mock('../lib/api', () => ({
  getProfile: (...args: any[]) => mockGetProfile(...args),
  getUserProfile: (...args: any[]) => mockGetUserProfile(...args),
  getReputation: (...args: any[]) => mockGetReputation(...args),
  getMutualFollows: (...args: any[]) => mockGetMutualFollows(...args),
  followUser: vi.fn().mockResolvedValue(undefined),
  unfollowUser: vi.fn().mockResolvedValue(undefined),
  sendFollowRequest: vi.fn().mockResolvedValue(undefined),
  cancelFollowRequest: vi.fn().mockResolvedValue(undefined),
  removeFollower: vi.fn().mockResolvedValue(undefined),
  featurePost: vi.fn().mockResolvedValue(undefined),
  unfeaturePost: vi.fn().mockResolvedValue(undefined),
  linkWallet: vi.fn().mockResolvedValue(undefined),
  setNftPfp: vi.fn().mockResolvedValue(undefined),
  getNfts: vi.fn().mockResolvedValue({ ownedNfts: [] }),
  api: {
    defaults: { headers: { common: {} } },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: () => ({ address: null, isConnected: false }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
  useBalance: () => ({ data: null }),
  useSignMessage: () => ({ signMessageAsync: vi.fn() }),
  ConnectButton: () => null,
}));

// Mock wallet hooks
vi.mock('../hooks/useEnsName', () => ({
  useEnsName: () => null,
}));

// Mock useToast
vi.mock('../hooks/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

// Mock components
vi.mock('../components/FollowRequests', () => ({
  FollowRequests: () => null,
}));

vi.mock('../components/post-list', () => ({
  PostList: () => null,
}));

vi.mock('../components/ProfileQrModal', () => ({
  ProfileQrModal: () => null,
}));

vi.mock('../components/PageShell', () => ({
  PageShell: ({ children }: any) => <div data-testid="page-shell">{children}</div>,
}));

vi.mock('../components/ui/skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock('../themes', () => ({
  themes: {
    default: { name: 'Default', styles: {} },
  },
}));

import { ProfilePage } from './profile';

function renderProfilePage(userId?: string) {
  const path = userId ? `/profile/${userId}` : '/profile';
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/profile" element={<ToastProvider><ProfilePage /></ToastProvider>} />
        <Route path="/profile/:id" element={<ToastProvider><ProfilePage /></ToastProvider>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetReputation.mockResolvedValue({ score: 100 });
    mockGetMutualFollows.mockResolvedValue([]);
  });

  // --- Loading state ---

  it('shows loading skeleton while fetching profile', () => {
    // Don't resolve the profile promise during render
    mockGetProfile.mockReturnValue(new Promise(() => {}));
    renderProfilePage();

    expect(screen.getByTestId('page-shell')).toBeInTheDocument();
  });

  // --- Own profile ---

  it('fetches own profile when no userId in params', async () => {
    const profile = { ...mockUser, followers: [] };
    mockGetProfile.mockResolvedValue(profile);
    mockGetReputation.mockResolvedValue({ score: 100 });
    renderProfilePage();

    await waitFor(() => {
      expect(mockGetProfile).toHaveBeenCalled();
    });
  });

  it('displays user display name from own profile', async () => {
    const profile = {
      ...mockUser,
      displayName: 'Test User',
      username: 'testuser',
      bio: 'A test bio',
      followers: [],
    };
    mockGetProfile.mockResolvedValue(profile);
    mockGetReputation.mockResolvedValue({ score: 100 });
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('displays username with @ prefix', async () => {
    const profile = { ...mockUser, username: 'testuser', followers: [] };
    mockGetProfile.mockResolvedValue(profile);
    mockGetReputation.mockResolvedValue({ score: 100 });
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('@testuser')).toBeInTheDocument();
    });
  });

  it('displays verified badge when user is verified', async () => {
    const profile = {
      ...mockUser,
      verified: true,
      followers: [],
    };
    mockGetProfile.mockResolvedValue(profile);
    mockGetReputation.mockResolvedValue({ score: 100 });
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByLabelText('Verified account')).toBeInTheDocument();
    });
  });

  it('displays user bio', async () => {
    const profile = {
      ...mockUser,
      bio: 'Hello, I am a test user!',
      followers: [],
    };
    mockGetProfile.mockResolvedValue(profile);
    mockGetReputation.mockResolvedValue({ score: 100 });
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Hello, I am a test user!')).toBeInTheDocument();
    });
  });

  // --- Other user's profile ---

  it('fetches other user profile when userId is provided', async () => {
    const profile = {
      id: 'other-user',
      username: 'other',
      displayName: 'Other User',
      bio: 'Another user',
      email: 'other@example.com',
      followers: [],
      profilePrivacy: 'public',
      verified: false,
    };
    mockGetUserProfile.mockResolvedValue(profile);
    mockGetReputation.mockResolvedValue({ score: 50 });
    mockGetMutualFollows.mockResolvedValue([]);
    renderProfilePage('other-user');

    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalledWith('other-user');
    });
  });

  it('displays other user display name', async () => {
    const profile = {
      id: 'other-user',
      username: 'other',
      displayName: 'Other User',
      bio: 'Another user',
      email: 'other@example.com',
      followers: [],
      profilePrivacy: 'public',
      verified: false,
    };
    mockGetUserProfile.mockResolvedValue(profile);
    mockGetReputation.mockResolvedValue({ score: 50 });
    mockGetMutualFollows.mockResolvedValue([]);
    renderProfilePage('other-user');

    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument();
    });
  });

  it('fetches mutual follows for other user profile', async () => {
    const profile = {
      id: 'other-user',
      username: 'other',
      displayName: 'Other User',
      bio: 'Hello',
      email: 'other@example.com',
      followers: [],
      profilePrivacy: 'public',
      verified: false,
    };
    mockGetUserProfile.mockResolvedValue(profile);
    mockGetReputation.mockResolvedValue({ score: 50 });
    mockGetMutualFollows.mockResolvedValue([]);
    renderProfilePage('other-user');

    await waitFor(() => {
      expect(mockGetMutualFollows).toHaveBeenCalledWith('other-user');
    });
  });

  // --- Follower / Following list display ---

  it('displays following count', async () => {
    const profile = {
      ...mockUser,
      following: [
        { id: 'u2', username: 'user2', displayName: 'User Two' },
        { id: 'u3', username: 'user3', displayName: 'User Three' },
      ],
      followers: [],
    };
    mockGetProfile.mockResolvedValue(profile);
    mockGetReputation.mockResolvedValue({ score: 100 });
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Following')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('displays followers count', async () => {
    const profile = {
      ...mockUser,
      followers: [
        { id: 'f1', username: 'follower1', displayName: 'Follower One' },
        { id: 'f2', username: 'follower2', displayName: 'Follower Two' },
        { id: 'f3', username: 'follower3', displayName: 'Follower Three' },
      ],
    };
    mockGetProfile.mockResolvedValue(profile);
    mockGetReputation.mockResolvedValue({ score: 100 });
    renderProfilePage();

    await waitFor(() => {
      // "Followers" appears both as the stat label and the section heading
      expect(screen.getAllByText('Followers').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('displays follower names in the follower list', async () => {
    const profile = {
      ...mockUser,
      followers: [
        { id: 'f1', username: 'follower1', displayName: 'Follower One' },
      ],
    };
    mockGetProfile.mockResolvedValue(profile);
    mockGetReputation.mockResolvedValue({ score: 100 });
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Follower One')).toBeInTheDocument();
      expect(screen.getByText('@follower1')).toBeInTheDocument();
    });
  });

  // --- Error handling ---

  it('handles profile fetch error gracefully', async () => {
    mockGetProfile.mockRejectedValue(new Error('Failed to fetch'));
    mockGetReputation.mockResolvedValue({ score: 0 });
    renderProfilePage();

    // Should not crash — the component catches the error
    await waitFor(() => {
      expect(mockGetProfile).toHaveBeenCalled();
    });
  });
});
