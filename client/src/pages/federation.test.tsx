import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { FederatedTimelineItem, FederationReport } from '../lib/api';

const mockGetFederatedTimeline = vi.fn();
const mockGetFederationStats = vi.fn();
const mockLikeFederatedPost = vi.fn();
const mockUnlikeFederatedPost = vi.fn();
const mockAnnounceFederatedPost = vi.fn();
const mockUndoAnnounceFederatedPost = vi.fn();

vi.mock('../lib/api', () => ({
  getFederatedTimeline: mockGetFederatedTimeline,
  getFederationStats: mockGetFederationStats,
  likeFederatedPost: mockLikeFederatedPost,
  unlikeFederatedPost: mockUnlikeFederatedPost,
  announceFederatedPost: mockAnnounceFederatedPost,
  undoAnnounceFederatedPost: mockUndoAnnounceFederatedPost,
}));

const REMOTE_ITEM: FederatedTimelineItem = {
  id: 'https://mastodon.example/users/alice/statuses/1',
  content: 'Hello from the fediverse',
  publishedAt: '2026-09-01T00:00:00.000Z',
  inReplyToId: null,
  mediaUrls: [],
  mentions: [],
  tags: [],
  likeCount: 3,
  shareCount: 1,
  isFederated: true,
  author: {
    actorId: 'https://mastodon.example/users/alice',
    username: 'alice',
    name: 'Alice',
    avatarUrl: null,
  },
  instance: {
    domain: 'mastodon.example',
    baseUrl: 'https://mastodon.example',
    software: 'mastodon',
  },
};

const STATS = {
  totalInstances: 2,
  activeInstances: 1,
  totalRemoteUsers: 4,
  totalRemotePosts: 7,
  localDomain: 'zynkra.test',
  localBaseUrl: 'http://localhost:3000',
  federationEnabled: true,
};

const report = (overrides: Partial<FederationReport> = {}): FederationReport => ({
  activityId: 'http://localhost:3000/federation/activities/abc',
  requested: 1,
  delivered: 1,
  failed: 0,
  results: [{ domain: 'mastodon.example', delivered: true }],
  ...overrides,
});

const signIn = () => localStorage.setItem('access_token', 'test-token');

async function renderPage() {
  const { default: FederationPage } = await import('./federation');
  return render(
    <MemoryRouter>
      <FederationPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  mockGetFederatedTimeline.mockResolvedValue({
    items: [REMOTE_ITEM],
    total: 1,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  mockGetFederationStats.mockResolvedValue(STATS);
  mockLikeFederatedPost.mockResolvedValue(report());
  mockAnnounceFederatedPost.mockResolvedValue(report());
});

describe('interpretReport', () => {
  it('treats a delivery as applied', async () => {
    const { interpretReport } = await import('./federation');
    expect(interpretReport(report(), 'like')).toEqual({ applied: true, notice: null });
  });

  it('treats "already federated" while liking as applied', async () => {
    const { interpretReport } = await import('./federation');
    // The like IS on the remote server; reporting a failure would make a
    // correct idempotent response look broken.
    const outcome = interpretReport(
      report({ delivered: 0, skipped: true, reason: 'already federated a Like for this object' }),
      'like'
    );
    expect(outcome.applied).toBe(true);
  });

  it('treats "never federated" while unliking as applied', async () => {
    const { interpretReport } = await import('./federation');
    const outcome = interpretReport(
      report({
        delivered: 0,
        skipped: true,
        reason: 'this like was never federated, so there is nothing to undo',
      }),
      'unlike'
    );
    // Nothing was sent because nothing needed to be. The end state is correct.
    expect(outcome.applied).toBe(true);
  });

  it('does not claim success for a skipped interaction the server refused', async () => {
    const { interpretReport } = await import('./federation');
    const outcome = interpretReport(
      report({ delivered: 0, skipped: true, reason: 'no known remote object https://x.example/1' }),
      'like'
    );
    expect(outcome.applied).toBe(false);
    expect(outcome.notice).toContain('no known remote object');
  });

  it('surfaces the per-instance reason when delivery was refused', async () => {
    const { interpretReport } = await import('./federation');
    const outcome = interpretReport(
      report({
        delivered: 0,
        failed: 1,
        results: [
          {
            domain: 'blocked.example',
            delivered: false,
            reason: 'instance is not connected or is blocked',
          },
        ],
      }),
      'boost'
    );
    expect(outcome.applied).toBe(false);
    expect(outcome.notice).toBe('instance is not connected or is blocked');
  });

  it('does not claim success when there is no response at all', async () => {
    const { interpretReport } = await import('./federation');
    expect(interpretReport(null, 'like').applied).toBe(false);
  });
});

describe('FederationPage', () => {
  it('renders remote posts with their author and instance', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Hello from the fediverse')).toBeInTheDocument();
    });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.getByText('mastodon')).toBeInTheDocument();
  });

  it('warns when outbound federation is disabled on the instance', async () => {
    mockGetFederationStats.mockResolvedValue({ ...STATS, federationEnabled: false });

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText(/outbound federation is disabled/i)).toBeInTheDocument();
    });
  });

  it('distinguishes a request failure from an empty timeline', async () => {
    mockGetFederatedTimeline.mockRejectedValue(new Error('network down'));

    await renderPage();

    // The de-routed community pages swallowed this into console.error, so an
    // outage rendered as "you have nothing here". The contents must be reported
    // as unknown, and the empty state must not appear at all.
    await waitFor(() => {
      expect(
        screen.getByText(/could not be loaded, so its contents are unknown/i)
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(/no remote posts have reached this instance yet/i)).toBeNull();
  });

  it('keeps showing the feed and a banner when loading more fails', async () => {
    signIn();
    mockGetFederatedTimeline.mockResolvedValueOnce({
      items: [REMOTE_ITEM],
      total: 60,
      limit: 20,
      offset: 0,
      hasMore: true,
    });
    mockGetFederatedTimeline.mockRejectedValueOnce(new Error('network down'));

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Hello from the fediverse')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));

    // Existing content stays; the failure is an inline notice, not a wipe.
    await waitFor(() => {
      expect(screen.getByText(/could not load more remote posts/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Hello from the fediverse')).toBeInTheDocument();
  });

  it('shows a real empty state when the server returns no posts', async () => {
    mockGetFederatedTimeline.mockResolvedValue({
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
      hasMore: false,
    });

    await renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/no remote posts have reached this instance yet/i)
      ).toBeInTheDocument();
    });
  });

  it('disables interactions and prompts sign-in when signed out', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /^like\b/i })).toBeDisabled();
  });

  it('marks the interaction applied only when the server delivered it', async () => {
    signIn();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Hello from the fediverse')).toBeInTheDocument();
    });

    // `/^like\b/` rather than `/^like/`: the "Liked" label also starts with
    // "Like", so an unanchored pattern matches both and getByRole throws.
    const likeButton = screen.getByRole('button', { name: /^like\b/i });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(mockLikeFederatedPost).toHaveBeenCalledWith(REMOTE_ITEM.id);
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^liked\b/i })).toBeInTheDocument();
    });
  });

  it('does not show a liked state when delivery failed', async () => {
    signIn();
    mockLikeFederatedPost.mockResolvedValue(
      report({
        delivered: 0,
        failed: 1,
        results: [
          {
            domain: 'mastodon.example',
            delivered: false,
            reason: 'instance is not connected or is blocked',
          },
        ],
      })
    );

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Hello from the fediverse')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /^like\b/i }));

    // The optimistic-toggle failure mode: the button would say "Liked" while the
    // remote server never saw anything.
    await waitFor(() => {
      expect(screen.getByText(/instance is not connected or is blocked/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /^like\b/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^liked\b/i })).toBeNull();
  });

  it('leaves the interaction untouched when the request never reached the server', async () => {
    signIn();
    mockLikeFederatedPost.mockRejectedValue(new Error('offline'));

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Hello from the fediverse')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /^like\b/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed before the server answered/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /^liked\b/i })).toBeNull();
  });

  it('undoes a like that was never federated without claiming a delivery', async () => {
    signIn();
    mockLikeFederatedPost.mockResolvedValue(report());
    mockUnlikeFederatedPost.mockResolvedValue(
      report({
        delivered: 0,
        skipped: true,
        reason: 'this like was never federated, so there is nothing to undo',
      })
    );

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Hello from the fediverse')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /^like\b/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^liked\b/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^liked\b/i }));

    await waitFor(() => {
      expect(mockUnlikeFederatedPost).toHaveBeenCalledWith(REMOTE_ITEM.id);
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^like\b/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/nothing had been federated/i)).toBeInTheDocument();
  });

  it('keeps the liked state when an unlike is refused', async () => {
    signIn();
    mockLikeFederatedPost.mockResolvedValue(report());
    mockUnlikeFederatedPost.mockResolvedValue(
      report({
        delivered: 0,
        failed: 1,
        results: [
          { domain: 'mastodon.example', delivered: false, reason: 'signature rejected (401)' },
        ],
      })
    );

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Hello from the fediverse')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /^like\b/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^liked\b/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^liked\b/i }));

    // The like is still on the remote server, so the button must still say so.
    // Clearing it here would tell the user they had unliked something they
    // had not.
    await waitFor(() => {
      expect(screen.getByText(/signature rejected/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /^liked\b/i })).toBeInTheDocument();
  });

  it('pages by page size, not by the number of visible items', async () => {
    signIn();
    // The server pages over the unfiltered query and then drops rows the viewer
    // blocked, so this page consumed 20 raw rows but only shows 1. Asking for
    // offset=1 would re-read rows that were already fetched and eventually
    // serve the same post twice.
    mockGetFederatedTimeline.mockResolvedValueOnce({
      items: [REMOTE_ITEM],
      total: 60,
      limit: 20,
      offset: 0,
      hasMore: true,
    });
    mockGetFederatedTimeline.mockResolvedValueOnce({
      items: [
        {
          ...REMOTE_ITEM,
          id: 'https://mastodon.example/users/bob/statuses/2',
          content: 'Second page',
        },
      ],
      total: 60,
      limit: 20,
      offset: 20,
      hasMore: false,
    });

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Hello from the fediverse')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));

    await waitFor(() => {
      expect(screen.getByText('Second page')).toBeInTheDocument();
    });
    expect(mockGetFederatedTimeline).toHaveBeenLastCalledWith(
      expect.objectContaining({ offset: 20 })
    );
  });

  it('boosts a remote post', async () => {
    signIn();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Hello from the fediverse')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /^boost\b/i }));

    await waitFor(() => {
      expect(mockAnnounceFederatedPost).toHaveBeenCalledWith(REMOTE_ITEM.id);
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^boosted\b/i })).toBeInTheDocument();
    });
  });
});
