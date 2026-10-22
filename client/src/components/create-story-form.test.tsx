/**
 * Create-story form: which interactive elements make it into the createStory
 * payload and which incomplete ones are dropped. Pins the wire shape the
 * server enforces — `{ type, data }` with no client-supplied `id` (the DB
 * assigns the element UUID on insert).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { StoryElementInput } from '../lib/types';
import { CreateStoryForm } from './create-story-form';

const mocks = vi.hoisted(() => ({
  createStory: vi.fn(async () => ({ id: 'story-1' })),
  setAuthToken: vi.fn(),
  addToast: vi.fn(),
}));

vi.mock('../lib/api', () => ({
  createStory: mocks.createStory,
  setAuthToken: mocks.setAuthToken,
  api: { get: vi.fn(async () => ({ data: [] })) },
}));

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({ addToast: mocks.addToast }),
}));

vi.mock('../hooks/useIsPremium', () => ({
  useIsPremium: () => false,
}));

function renderForm() {
  const onClose = vi.fn();
  const onStoryCreated = vi.fn();
  render(
    <MemoryRouter>
      <CreateStoryForm onClose={onClose} onStoryCreated={onStoryCreated} />
    </MemoryRouter>
  );
  return { onClose, onStoryCreated };
}

function attachFile() {
  const input = screen.getByLabelText('Upload Image or Video');
  const file = new File(['fake'], 'story.jpg', { type: 'image/jpeg' });
  fireEvent.change(input, { target: { files: [file] } });
  return file;
}

/** Elements of the most recent createStory call, plus the fixed FormData args. */
function lastSubmit() {
  const calls = mocks.createStory.mock.calls;
  const call = calls[calls.length - 1] as unknown as [File, StoryElementInput[], string, boolean];
  expect(call).toBeDefined();
  const [file, elements, audience, isBoosted] = call;
  return { file, elements, audience, isBoosted };
}

describe('CreateStoryForm element payload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('drops an incomplete poll but submits a complete one without ids', async () => {
    renderForm();
    attachFile();

    fireEvent.click(screen.getByText('Add Poll'));
    fireEvent.click(screen.getByText('Post Story'));
    await waitFor(() => expect(mocks.createStory).toHaveBeenCalledTimes(1));
    expect(lastSubmit().elements).toEqual([]);

    fireEvent.change(screen.getByPlaceholderText('Poll Question'), {
      target: { value: 'Best?' },
    });
    fireEvent.change(screen.getByPlaceholderText('Option 1'), { target: { value: 'A' } });
    fireEvent.change(screen.getByPlaceholderText('Option 2'), { target: { value: 'B' } });
    fireEvent.click(screen.getByText('Post Story'));
    await waitFor(() => expect(mocks.createStory).toHaveBeenCalledTimes(2));

    const { file, elements, audience, isBoosted } = lastSubmit();
    expect(file).toBeInstanceOf(File);
    expect(audience).toBe('public');
    expect(isBoosted).toBe(false);
    expect(elements).toHaveLength(1);
    expect(elements[0]).toEqual({
      type: 'poll',
      data: { question: 'Best?', options: ['A', 'B'] },
    });
    expect(Object.keys(elements[0])).not.toContain('id');
  });

  it('submits a mention element only once a username is entered', async () => {
    renderForm();
    attachFile();

    fireEvent.click(screen.getByText('Add Mention'));
    fireEvent.click(screen.getByText('Post Story'));
    await waitFor(() => expect(mocks.createStory).toHaveBeenCalledTimes(1));
    expect(lastSubmit().elements).toEqual([]);

    fireEvent.change(screen.getByPlaceholderText('Username to mention'), {
      target: { value: 'friend' },
    });
    fireEvent.click(screen.getByText('Post Story'));
    await waitFor(() => expect(mocks.createStory).toHaveBeenCalledTimes(2));

    const elements = lastSubmit().elements;
    expect(elements).toEqual([{ type: 'mention', data: { username: 'friend' } }]);
    expect(Object.keys(elements[0])).not.toContain('id');
  });

  it('submits the Q&A template question but drops the incomplete countdown', async () => {
    renderForm();
    attachFile();

    fireEvent.click(screen.getByText('Use Template'));
    const qaCard = screen.getByText('Q&A Story').closest('div')?.parentElement;
    expect(qaCard).toBeTruthy();
    fireEvent.click(within(qaCard as HTMLElement).getByText('Apply'));

    fireEvent.click(screen.getByText('Post Story'));
    await waitFor(() => expect(mocks.createStory).toHaveBeenCalledTimes(1));
    expect(lastSubmit().elements).toEqual([{ type: 'qa', data: { question: 'Ask me anything!' } }]);

    // The countdown template ships an empty endDate and the form exposes no
    // editor for it, so it must never reach the payload.
    fireEvent.click(screen.getByText('Use Template'));
    const countdownCard = screen.getByText('Countdown Story').closest('div')?.parentElement;
    expect(countdownCard).toBeTruthy();
    fireEvent.click(within(countdownCard as HTMLElement).getByText('Apply'));

    fireEvent.click(screen.getByText('Post Story'));
    await waitFor(() => expect(mocks.createStory).toHaveBeenCalledTimes(2));
    expect(lastSubmit().elements.map((element) => element.type)).toEqual(['qa']);
  });
});
