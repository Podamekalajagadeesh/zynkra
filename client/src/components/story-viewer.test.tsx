/**
 * Story viewer: `GET /stories/:id/views` is owner-only, so only the owner may
 * fetch and render the viewers list — non-owners must not call it at all (it
 * used to 401/403 for everyone else). Also pins the shared 'mention' element
 * type path (the local widening workaround is gone) and the poll wiring
 * (viewer passes storyId + elementId so Poll can fetch/cast tallies).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Story } from '../lib/types';
import { StoryViewer } from './story-viewer';

const mocks = vi.hoisted(() => ({
  getStoryViews: vi.fn(async () => [
    { id: 'v1', username: 'fan', displayName: 'Fan', email: null, walletAddress: null },
  ]),
  trackStoryView: vi.fn(async () => ({})),
  addStoryReaction: vi.fn(async () => ({})),
  addStoryReply: vi.fn(async () => ({})),
  getStoryPollResults: vi.fn(async () => ({
    optionCounts: [0, 0],
    totalVotes: 0,
    myVote: null,
  })),
  voteStoryPoll: vi.fn(async () => ({
    optionCounts: [1, 0],
    totalVotes: 1,
    myVote: 0,
  })),
  getUserHighlights: vi.fn(async () => [
    {
      id: 'h1',
      title: 'Best moments',
      coverUrl: '/covers/best.jpg',
      createdAt: '2026-01-01T00:00:00.000Z',
      stories: [{ id: 's0', mediaUrl: '/old.jpg' }],
    },
  ]),
  createHighlight: vi.fn(async () => ({})),
  updateHighlight: vi.fn(async () => ({})),
  getStoryReplies: vi.fn(
    async (
      _storyId: string,
      _page?: number,
      _limit?: number
    ): Promise<{
      data: unknown[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }> => ({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    })
  ),
  deleteStoryReply: vi.fn(async (_storyId: string, _replyId: string) => undefined),
  currentUser: null as { id: string; username?: string } | null,
}));

vi.mock('../lib/api', () => ({
  getStoryViews: mocks.getStoryViews,
  trackStoryView: mocks.trackStoryView,
  addStoryReaction: mocks.addStoryReaction,
  addStoryReply: mocks.addStoryReply,
  getStoryPollResults: mocks.getStoryPollResults,
  voteStoryPoll: mocks.voteStoryPoll,
  getUserHighlights: mocks.getUserHighlights,
  createHighlight: mocks.createHighlight,
  updateHighlight: mocks.updateHighlight,
  getStoryReplies: mocks.getStoryReplies,
  deleteStoryReply: mocks.deleteStoryReply,
}));

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({ user: mocks.currentUser }),
}));

vi.mock('../hooks/useIsPremium', () => ({
  useIsPremium: () => false,
}));

vi.mock('../hooks/useScreenshotProtection', () => ({
  useScreenshotProtection: () => ({ protectionRef: { current: null } }),
}));

function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 'story-1',
    mediaUrl: '/story.jpg',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    user: { id: 'user-1', email: 'owner@test.com', walletAddress: '0xowner', username: 'owner' },
    ...overrides,
  };
}

function renderViewer(stories: Story[]) {
  const onClose = vi.fn();
  render(
    <MemoryRouter>
      <StoryViewer stories={stories} initialStoryIndex={0} onClose={onClose} />
    </MemoryRouter>
  );
  return { onClose };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.currentUser = { id: 'user-1' };
});

describe('StoryViewer viewers list (owner-only endpoint)', () => {
  it('fetches and renders the viewers list for the story owner', async () => {
    renderViewer([makeStory()]);

    await waitFor(() => expect(mocks.getStoryViews).toHaveBeenCalledWith('story-1'));
    expect(await screen.findByRole('button', { name: '1' })).toBeTruthy();
  });

  it('never calls the owner-only endpoint and hides the viewers button for non-owners', async () => {
    mocks.currentUser = { id: 'someone-else' };
    renderViewer([makeStory()]);

    await waitFor(() => expect(mocks.trackStoryView).toHaveBeenCalledWith('story-1', false));
    expect(mocks.getStoryViews).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /^\d+$/ })).toBeNull();
  });
});

describe('StoryViewer mention element', () => {
  it('renders a mention element through the shared StoryElement type', async () => {
    renderViewer([
      makeStory({ elements: [{ id: 'e1', type: 'mention', data: { username: 'friend' } }] }),
    ]);

    expect(await screen.findByText('@friend')).toBeTruthy();
  });
});

describe('StoryViewer poll wiring', () => {
  it('mounts the poll with the story and element ids and fetches tallies', async () => {
    mocks.currentUser = { id: 'someone-else' };
    renderViewer([
      makeStory({
        id: 'story-9',
        elements: [
          {
            id: 'el-poll',
            type: 'poll',
            data: { question: 'Best?', options: ['A', 'B'] },
          },
        ],
      }),
    ]);

    expect(await screen.findByText('Best?')).toBeTruthy();
    await waitFor(() =>
      expect(mocks.getStoryPollResults).toHaveBeenCalledWith('story-9', 'el-poll')
    );
    expect(mocks.getStoryViews).not.toHaveBeenCalled();
  });
});

describe('StoryViewer highlight save', () => {
  it('shows the Highlight action to the owner', async () => {
    mocks.currentUser = { id: 'user-1', username: 'owner' };
    renderViewer([makeStory()]);
    expect(await screen.findByRole('button', { name: 'Highlight' })).toBeTruthy();
  });

  it('hides the Highlight action from non-owners', async () => {
    mocks.currentUser = { id: 'someone-else', username: 'fan' };
    renderViewer([makeStory()]);
    await waitFor(() => expect(mocks.trackStoryView).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Highlight' })).toBeNull();
  });

  it('saves the current story into an existing highlight (append, not replace)', async () => {
    mocks.currentUser = { id: 'user-1', username: 'owner' };
    renderViewer([makeStory()]);

    fireEvent.click(await screen.findByRole('button', { name: 'Highlight' }));
    await waitFor(() => expect(mocks.getUserHighlights).toHaveBeenCalledWith('owner'));

    fireEvent.click(await screen.findByRole('button', { name: /Best moments/ }));

    await waitFor(() =>
      expect(mocks.updateHighlight).toHaveBeenCalledWith('h1', {
        storyIds: ['s0', 'story-1'],
      })
    );
    expect(mocks.createHighlight).not.toHaveBeenCalled();
  });

  it('creates a new highlight from the current story', async () => {
    mocks.currentUser = { id: 'user-1', username: 'owner' };
    renderViewer([makeStory()]);

    fireEvent.click(await screen.findByRole('button', { name: 'Highlight' }));
    fireEvent.change(await screen.findByLabelText('New highlight title'), {
      target: { value: 'Favorites' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create highlight' }));

    await waitFor(() =>
      expect(mocks.createHighlight).toHaveBeenCalledWith({
        title: 'Favorites',
        coverUrl: '/story.jpg',
        storyIds: ['story-1'],
      })
    );
    expect(mocks.updateHighlight).not.toHaveBeenCalled();
  });
});

describe('StoryViewer replies inbox (owner-only endpoint)', () => {
  const makeReply = (overrides: Record<string, unknown> = {}) => ({
    id: 'reply-1',
    text: 'Nice!',
    createdAt: '2026-01-01T00:00:00.000Z',
    user: {
      id: 'u2',
      email: null,
      walletAddress: null,
      username: 'fan',
      displayName: 'Fan',
      profile: {},
    },
    ...overrides,
  });

  it('fetches the owner inbox eagerly and shows the total on the trigger', async () => {
    mocks.getStoryReplies.mockResolvedValue({
      data: [makeReply()],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    mocks.currentUser = { id: 'user-1', username: 'owner' };
    renderViewer([makeStory()]);

    const trigger = await screen.findByRole('button', { name: 'Replies' });
    await waitFor(() => expect(mocks.getStoryReplies).toHaveBeenCalledWith('story-1'));
    expect(within(trigger).getByText('1')).toBeTruthy();
  });

  it('never fetches the inbox or shows the entry for non-owners', async () => {
    mocks.getStoryReplies.mockResolvedValue({
      data: [makeReply()],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    mocks.currentUser = { id: 'someone-else', username: 'fan' };
    renderViewer([makeStory()]);

    await waitFor(() => expect(mocks.trackStoryView).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Replies' })).toBeNull();
    expect(mocks.getStoryReplies).not.toHaveBeenCalled();
  });

  it('opens the dialog with sender info and deletes a reply through the API', async () => {
    mocks.getStoryReplies.mockResolvedValue({
      data: [makeReply()],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    mocks.currentUser = { id: 'user-1', username: 'owner' };
    renderViewer([makeStory()]);

    fireEvent.click(await screen.findByRole('button', { name: 'Replies' }));

    expect(await screen.findByText('Nice!')).toBeTruthy();
    expect(screen.getByText('Fan')).toBeTruthy();
    expect(screen.getByText('@fan')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Delete reply' }));

    await waitFor(() => expect(mocks.deleteStoryReply).toHaveBeenCalledWith('story-1', 'reply-1'));
    await waitFor(() => expect(screen.queryByText('Nice!')).toBeNull());
    expect(screen.getByText('No replies yet')).toBeTruthy();
  });

  it('shows an empty state when the story has no replies', async () => {
    mocks.getStoryReplies.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    mocks.currentUser = { id: 'user-1', username: 'owner' };
    renderViewer([makeStory()]);

    fireEvent.click(await screen.findByRole('button', { name: 'Replies' }));

    expect(await screen.findByText('No replies yet')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Load more replies' })).toBeNull();
  });

  it('loads the next page on "Load more" and appends replies', async () => {
    mocks.getStoryReplies
      .mockResolvedValueOnce({
        data: [makeReply()],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        data: [makeReply({ id: 'reply-2', text: 'Second one' })],
        total: 2,
        page: 2,
        limit: 20,
        totalPages: 2,
      });
    mocks.currentUser = { id: 'user-1', username: 'owner' };
    renderViewer([makeStory()]);

    fireEvent.click(await screen.findByRole('button', { name: 'Replies' }));
    expect(await screen.findByText('Nice!')).toBeTruthy();

    fireEvent.click(await screen.findByRole('button', { name: 'Load more replies' }));

    await waitFor(() => expect(mocks.getStoryReplies).toHaveBeenLastCalledWith('story-1', 2));
    expect(await screen.findByText('Second one')).toBeTruthy();
    expect(screen.getByText('Nice!')).toBeTruthy();
    // Page 2 was the last one: the loader retires itself.
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Load more replies' })).toBeNull()
    );
  });
});
