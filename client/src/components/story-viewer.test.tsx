/**
 * Story viewer: `GET /stories/:id/views` is owner-only, so only the owner may
 * fetch and render the viewers list — non-owners must not call it at all (it
 * used to 401/403 for everyone else). Also pins the shared 'mention' element
 * type path (the local widening workaround is gone) and the poll wiring
 * (viewer passes storyId + elementId so Poll can fetch/cast tallies).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
