/**
 * Story poll voting: tallies fetch on mount (authed only), a cast returns the
 * authoritative results used for the live percentage bars, and logged-out
 * clicks redirect to /login (approved plan decisions #1 and #2).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Poll } from './poll';

const mocks = vi.hoisted(() => ({
  getStoryPollResults: vi.fn(),
  voteStoryPoll: vi.fn(),
  currentUser: { id: 'user-1' } as { id: string } | null,
}));

vi.mock('../lib/api', () => ({
  getStoryPollResults: mocks.getStoryPollResults,
  voteStoryPoll: mocks.voteStoryPoll,
}));

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({ user: mocks.currentUser }),
}));

const NO_VOTES = { optionCounts: [0, 0], totalVotes: 0, myVote: null };

function renderPoll() {
  return render(
    <MemoryRouter>
      <Poll storyId="story-1" elementId="el-1" question="Fav color?" options={['Red', 'Blue']} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.currentUser = { id: 'user-1' };
  mocks.getStoryPollResults.mockResolvedValue(NO_VOTES);
  mocks.voteStoryPoll.mockResolvedValue(NO_VOTES);
});

describe('Poll rendering', () => {
  it('renders the poll question and every option as a button', async () => {
    renderPoll();
    expect(screen.getByText('Fav color?')).toBeInTheDocument();
    const buttons = await screen.findAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('Red');
    expect(buttons[1]).toHaveTextContent('Blue');
  });

  it('renders a zero-state when nobody has voted', async () => {
    renderPoll();
    expect(await screen.findByText(/No votes yet/)).toBeInTheDocument();
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  it('renders empty options without crashing', async () => {
    render(
      <MemoryRouter>
        <Poll storyId="story-1" elementId="el-1" question="No options?" options={[]} />
      </MemoryRouter>
    );
    expect(await screen.findByText('No options?')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

describe('Poll live results', () => {
  it('fetches tallies on mount and renders percentages', async () => {
    mocks.getStoryPollResults.mockResolvedValue({
      optionCounts: [1, 3],
      totalVotes: 4,
      myVote: 1,
    });

    renderPoll();

    await waitFor(() => expect(mocks.getStoryPollResults).toHaveBeenCalledWith('story-1', 'el-1'));
    expect(await screen.findByText('25%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('4 votes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Blue/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('casts a vote and replaces the bars with the server response', async () => {
    mocks.getStoryPollResults.mockResolvedValue({
      optionCounts: [3, 1],
      totalVotes: 4,
      myVote: 0,
    });
    mocks.voteStoryPoll.mockResolvedValue({
      optionCounts: [1, 3],
      totalVotes: 4,
      myVote: 1,
    });

    renderPoll();
    const blue = await screen.findByRole('button', { name: /^Blue/ });
    expect(blue).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(blue);

    await waitFor(() => expect(mocks.voteStoryPoll).toHaveBeenCalledWith('story-1', 'el-1', 1));
    expect(await screen.findByText('75%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Blue/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps percentages hidden when the results fetch fails', async () => {
    mocks.getStoryPollResults.mockRejectedValue(new Error('offline'));

    renderPoll();

    expect(await screen.findByText('Fav color?')).toBeInTheDocument();
    await waitFor(() => expect(mocks.getStoryPollResults).toHaveBeenCalled());
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
  });
});

describe('Poll login gate', () => {
  it('redirects logged-out clicks to /login without voting', async () => {
    mocks.currentUser = null;

    render(
      <MemoryRouter initialEntries={['/feed']}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route
            path="*"
            element={
              <Poll
                storyId="story-1"
                elementId="el-1"
                question="Fav color?"
                options={['Red', 'Blue']}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    const red = await screen.findByRole('button', { name: /Red/ });
    fireEvent.click(red);

    expect(await screen.findByText('login page')).toBeInTheDocument();
    expect(mocks.voteStoryPoll).not.toHaveBeenCalled();
    expect(mocks.getStoryPollResults).not.toHaveBeenCalled();
  });
});
