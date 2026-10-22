/**
 * Story viewer: `GET /stories/:id/views` is owner-only, so only the owner may
 * fetch and render the viewers list — non-owners must not call it at all (it
 * used to 401/403 for everyone else). Also pins the shared 'mention' element
 * type path (the local widening workaround is gone).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { Story } from '../lib/types';
import { StoryViewer } from './story-viewer';

const mocks = vi.hoisted(() => ({
  getStoryViews: vi.fn(async () => [
    { id: 'v1', username: 'fan', displayName: 'Fan', email: null, walletAddress: null },
  ]),
  trackStoryView: vi.fn(async () => ({})),
  addStoryReaction: vi.fn(async () => ({})),
  addStoryReply: vi.fn(async () => ({})),
  currentUser: null as { id: string } | null,
}));

vi.mock('../lib/api', () => ({
  getStoryViews: mocks.getStoryViews,
  trackStoryView: mocks.trackStoryView,
  addStoryReaction: mocks.addStoryReaction,
  addStoryReply: mocks.addStoryReply,
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
  render(<StoryViewer stories={stories} initialStoryIndex={0} onClose={onClose} />);
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
