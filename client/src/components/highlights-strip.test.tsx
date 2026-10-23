/**
 * Profile highlight strip: visibility-scoped fetch, "+" create tile on own
 * profile only, tap-to-open via getHighlight, and the edit/delete flows that
 * run through HighlightFormModal.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { HighlightsStrip } from './highlights-strip';

const mocks = vi.hoisted(() => ({
  getUserHighlights: vi.fn(),
  getHighlight: vi.fn(),
  createHighlight: vi.fn(),
  updateHighlight: vi.fn(),
  deleteHighlight: vi.fn(),
  getStories: vi.fn(),
  addToast: vi.fn(),
}));

vi.mock('../lib/api', () => ({
  getUserHighlights: mocks.getUserHighlights,
  getHighlight: mocks.getHighlight,
  createHighlight: mocks.createHighlight,
  updateHighlight: mocks.updateHighlight,
  deleteHighlight: mocks.deleteHighlight,
  getStories: mocks.getStories,
}));

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({ addToast: mocks.addToast }),
}));

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({ user: { id: 'user-1', username: 'alice' } }),
}));

function makeHighlight(overrides: Record<string, unknown> = {}) {
  return {
    id: 'h1',
    title: 'Travel',
    coverUrl: '/covers/travel.jpg',
    createdAt: '2026-01-01T00:00:00.000Z',
    stories: [{ id: 's1', mediaUrl: '/m1.jpg' }],
    ...overrides,
  };
}

function renderStrip(isOwnProfile = true) {
  const onOpenStories = vi.fn();
  render(
    <HighlightsStrip username="alice" isOwnProfile={isOwnProfile} onOpenStories={onOpenStories} />
  );
  return { onOpenStories };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUserHighlights.mockResolvedValue([makeHighlight()]);
  mocks.getHighlight.mockResolvedValue(makeHighlight());
  mocks.getStories.mockResolvedValue([
    { id: 's1', mediaUrl: '/m1.jpg', user: { id: 'user-1' } },
    { id: 's2', mediaUrl: '/m2.jpg', user: { id: 'user-1' } },
  ]);
  mocks.createHighlight.mockResolvedValue({});
  mocks.updateHighlight.mockResolvedValue({});
  mocks.deleteHighlight.mockResolvedValue(undefined);
});

describe('HighlightsStrip rendering', () => {
  it('renders cover thumbnails and title labels', async () => {
    renderStrip();

    const tile = await screen.findByRole('button', { name: 'Open highlight Travel' });
    expect(within(tile).getByText('Travel')).toBeInTheDocument();
    const img = within(tile).getByRole('img');
    expect(img).toHaveAttribute('src', '/covers/travel.jpg');
    expect(mocks.getUserHighlights).toHaveBeenCalledWith('alice');
  });

  it('shows the "+" create tile on your own profile', async () => {
    renderStrip(true);
    expect(await screen.findByRole('button', { name: 'Add highlight' })).toBeInTheDocument();
  });

  it('hides the "+" create tile on someone else’s profile', async () => {
    renderStrip(false);
    await waitFor(() => expect(mocks.getUserHighlights).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Add highlight' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Open highlight Travel' })).toBeInTheDocument();
  });

  it('renders nothing for someone else with no visible highlights', async () => {
    mocks.getUserHighlights.mockResolvedValue([]);
    const { onOpenStories } = renderStrip(false);

    await waitFor(() => expect(mocks.getUserHighlights).toHaveBeenCalled());
    expect(screen.queryByRole('button')).toBeNull();
    expect(onOpenStories).not.toHaveBeenCalled();
  });

  it('keeps the create tile when your own list is empty', async () => {
    mocks.getUserHighlights.mockResolvedValue([]);
    renderStrip(true);

    expect(await screen.findByRole('button', { name: 'Add highlight' })).toBeInTheDocument();
  });
});

describe('HighlightsStrip open flow', () => {
  it('fetches the highlight and hands its stories to the viewer', async () => {
    const { onOpenStories } = renderStrip();

    fireEvent.click(await screen.findByRole('button', { name: 'Open highlight Travel' }));

    await waitFor(() => expect(mocks.getHighlight).toHaveBeenCalledWith('h1'));
    expect(onOpenStories).toHaveBeenCalledWith([{ id: 's1', mediaUrl: '/m1.jpg' }]);
  });
});

describe('HighlightsStrip create flow', () => {
  it('creates a highlight from selected stories with the first cover', async () => {
    renderStrip();
    fireEvent.click(await screen.findByRole('button', { name: 'Add highlight' }));

    const title = await screen.findByLabelText('Highlight title');
    fireEvent.change(title, { target: { value: 'Best of 2026' } });
    fireEvent.click(await screen.findByLabelText('Select story s1'));
    fireEvent.click(screen.getByRole('button', { name: /Create/ }));

    await waitFor(() =>
      expect(mocks.createHighlight).toHaveBeenCalledWith({
        title: 'Best of 2026',
        coverUrl: '/m1.jpg',
        storyIds: ['s1'],
      })
    );
    // The strip refetches after a successful save.
    await waitFor(() => expect(mocks.getUserHighlights).toHaveBeenCalledTimes(2));
  });

  it('blocks creation until a title and at least one story are chosen', async () => {
    renderStrip();
    fireEvent.click(await screen.findByRole('button', { name: 'Add highlight' }));

    const submit = await screen.findByRole('button', { name: /Create/ });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Highlight title'), {
      target: { value: 'No stories' },
    });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Select story s1'));
    expect(submit).toBeEnabled();
    expect(mocks.createHighlight).not.toHaveBeenCalled();
  });
});

describe('HighlightsStrip edit & delete flows', () => {
  it('renames a highlight through PATCH', async () => {
    renderStrip();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit highlight Travel' }));

    const title = await screen.findByLabelText('Highlight title');
    expect(title).toHaveValue('Travel');
    fireEvent.change(title, { target: { value: 'Trips' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mocks.updateHighlight).toHaveBeenCalledWith('h1', {
        title: 'Trips',
        storyIds: ['s1'],
      })
    );
  });

  it('deletes a highlight after confirmation and refetches', async () => {
    renderStrip();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit highlight Travel' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete highlight' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(mocks.deleteHighlight).toHaveBeenCalledWith('h1'));
    await waitFor(() => expect(mocks.getUserHighlights).toHaveBeenCalledTimes(2));
    expect(mocks.addToast).toHaveBeenCalledWith('Highlight deleted', 'success');
  });

  it('will not strip the last remaining story in edit mode', async () => {
    renderStrip();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit highlight Travel' }));

    const remove = await screen.findByRole('button', { name: 'Remove story s1' });
    expect(remove).toBeDisabled();
  });
});
