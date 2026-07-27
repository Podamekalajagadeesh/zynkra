import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PostCard } from './post-card';
import { ToastProvider } from '../contexts/ToastContext';

// --- Mocks for hooks ---

vi.mock('../hooks/useScreenshotProtection', () => ({
  useScreenshotProtection: () => ({ protectionRef: { current: null } }),
}));

vi.mock('../hooks/useIsPremium', () => ({
  useIsPremium: () => false,
}));

vi.mock('../hooks/useEnsName', () => ({
  useEnsName: () => null,
}));

vi.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x123' }),
  useBalance: () => ({ data: { formatted: '1.5', symbol: 'ETH' } }),
}));

vi.mock('../contexts/PreferencesContext', () => ({
  useAppPreferences: () => ({
    autoTranslate: false,
    language: 'en',
    contentWarningsEnabled: false,
  }),
}));

// --- Mocks for sub-components ---

vi.mock('./ReactionButtons', () => ({
  ReactionButtons: () => <div data-testid="reaction-buttons" />,
}));

vi.mock('./CommunityNotes', () => ({
  CommunityNotes: () => <div data-testid="community-notes" />,
}));

vi.mock('./PromotionModal', () => ({
  PromotionModal: () => <div data-testid="promotion-modal" />,
}));

vi.mock('./moderation/ContentWarningBanner', () => ({
  ContentWarningBanner: () => <div data-testid="content-warning-banner" />,
}));

vi.mock('./monetization/GiftButton', () => ({
  GiftButton: () => <div data-testid="gift-button" />,
}));

vi.mock('./LowBandwidthMedia', () => ({
  LowBandwidthMedia: (props: any) => <div data-testid="low-bandwidth-media" />,
}));

vi.mock('./ui/avatar', () => ({
  default: () => <div data-testid="avatar" />,
}));

vi.mock('./ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

// --- Mocks for services ---

vi.mock('../services/contentModerationService', () => ({}));
vi.mock('../services/contentOwnership', () => ({
  contentOwnershipService: { registerContent: vi.fn() },
}));
vi.mock('../services/wallet', () => ({
  walletService: { getConnectedWallet: vi.fn() },
}));

vi.mock('../lib/preferences', () => ({
  formatDateTime: (d: string) => d,
}));

// --- Mocks for API ---

const mockVoteOnPoll = vi.fn();

vi.mock('../lib/api', () => ({
  voteOnPoll: (...args: any[]) => mockVoteOnPoll(...args),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
  reportPost: vi.fn(),
  addPostReaction: vi.fn(),
  createComment: vi.fn(),
  getComments: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  togglePinPost: vi.fn(),
  sendTip: vi.fn(),
  blockUser: vi.fn(),
  addBookmark: vi.fn(),
  removeBookmark: vi.fn(),
  addToWatchLater: vi.fn(),
  removeFromWatchLater: vi.fn(),
  addToReadLater: vi.fn(),
  removeFromReadLater: vi.fn(),
  searchUsers: vi.fn(),
  repost: vi.fn(),
  undoRepost: vi.fn(),
  quotePost: vi.fn(),
  createLead: vi.fn(),
  pinComment: vi.fn(),
  deleteComment: vi.fn(),
  lockComment: vi.fn(),
  getGifts: vi.fn(),
  sendGift: vi.fn(),
  translateText: vi.fn(),
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

// --- Mock ToastContext ---

const mockAddToast = vi.fn();

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

// --- Helpers ---

function makePostWithPoll(overrides: Record<string, any> = {}) {
  return {
    id: 'post-1',
    content: 'What color do you like?',
    createdAt: new Date().toISOString(),
    user: {
      id: 'user-1',
      email: null,
      walletAddress: null,
      displayName: 'Alice',
    },
    media: [],
    comments: [],
    poll: [
      {
        id: 'poll-1',
        question: 'Fav color?',
        options: [
          { id: 'opt-1', text: 'Red', voteCount: 3, votes: [{ id: 'u-1' }, { id: 'u-2' }, { id: 'u-3' }] },
          { id: 'opt-2', text: 'Blue', voteCount: 1, votes: [{ id: 'u-4' }] },
        ],
      },
    ],
    ...overrides,
  };
}

function makeCurrentUser(id = 'user-5') {
  return { id, following: [] };
}

function renderPostCard(post: any = makePostWithPoll(), currentUser: any = makeCurrentUser()) {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <PostCard post={post} currentUser={currentUser} />
      </ToastProvider>
    </MemoryRouter>
  );
}

// --- Tests ---

describe('PostCard poll rendering and voting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the poll question', () => {
    renderPostCard();
    expect(screen.getByText('Fav color?')).toBeInTheDocument();
  });

  it('renders options as buttons when user has not voted', () => {
    renderPostCard(makePostWithPoll(), makeCurrentUser('user-5'));
    expect(screen.getByRole('button', { name: 'Red' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Blue' })).toBeInTheDocument();
  });

  it('shows percentage bars when user has voted', () => {
    renderPostCard(makePostWithPoll(), makeCurrentUser('u-1'));
    // Red: 3/4 = 75%, Blue: 1/4 = 25%
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    // Should NOT show option buttons
    expect(screen.queryByRole('button', { name: 'Red' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Blue' })).not.toBeInTheDocument();
  });

  it('shows 0% when totalVotes is 0', () => {
    const postWithZeroVotes = makePostWithPoll({
      poll: [
        {
          id: 'poll-1',
          question: 'New poll?',
          options: [
            { id: 'opt-1', text: 'Yes', voteCount: 0, votes: [] },
            { id: 'opt-2', text: 'No', voteCount: 0, votes: [] },
          ],
        },
      ],
    });
    // User has voted (votes array has their id) but voteCount is stale
    const userWhoVoted = makeCurrentUser('u-stale');
    const postWithStaleVotes = makePostWithPoll({
      poll: [
        {
          id: 'poll-1',
          question: 'Stale?',
          options: [
            { id: 'opt-1', text: 'A', voteCount: 0, votes: [{ id: 'u-stale' }] },
            { id: 'opt-2', text: 'B', voteCount: 0, votes: [] },
          ],
        },
      ],
    });
    renderPostCard(postWithStaleVotes, userWhoVoted);
    // totalVotes = 0, so percentage = 0% for both
    const zeroTexts = screen.getAllByText('0%');
    expect(zeroTexts.length).toBe(2);
  });

  it('calls voteOnPoll when clicking an option button', async () => {
    const user = userEvent.setup();
    const updatedPoll = {
      id: 'poll-1',
      question: 'Fav color?',
      options: [
        { id: 'opt-1', text: 'Red', voteCount: 4, votes: [{ id: 'u-1' }, { id: 'u-2' }, { id: 'u-3' }, { id: 'user-5' }] },
        { id: 'opt-2', text: 'Blue', voteCount: 1, votes: [{ id: 'u-4' }] },
      ],
    };
    mockVoteOnPoll.mockResolvedValue(updatedPoll);

    renderPostCard(makePostWithPoll(), makeCurrentUser('user-5'));
    await user.click(screen.getByRole('button', { name: 'Red' }));

    expect(mockVoteOnPoll).toHaveBeenCalledWith('opt-1');
  });

  it('shows success toast after voting', async () => {
    const user = userEvent.setup();
    const updatedPoll = {
      id: 'poll-1',
      question: 'Fav color?',
      options: [
        { id: 'opt-1', text: 'Red', voteCount: 4, votes: [{ id: 'u-1' }, { id: 'u-2' }, { id: 'u-3' }, { id: 'user-5' }] },
        { id: 'opt-2', text: 'Blue', voteCount: 1, votes: [{ id: 'u-4' }] },
      ],
    };
    mockVoteOnPoll.mockResolvedValue(updatedPoll);

    renderPostCard(makePostWithPoll(), makeCurrentUser('user-5'));
    await user.click(screen.getByRole('button', { name: 'Red' }));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Voted successfully!', 'success');
    });
  });

  it('shows error toast when vote fails', async () => {
    const user = userEvent.setup();
    mockVoteOnPoll.mockRejectedValue(new Error('Network error'));

    renderPostCard(makePostWithPoll(), makeCurrentUser('user-5'));
    await user.click(screen.getByRole('button', { name: 'Red' }));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Failed to vote on poll', 'error');
    });
  });

  it('does not render poll section when post has no poll', () => {
    const postNoPoll = makePostWithPoll({ poll: undefined });
    renderPostCard(postNoPoll, makeCurrentUser());
    expect(screen.queryByText('Fav color?')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Red' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Blue' })).not.toBeInTheDocument();
  });
});
