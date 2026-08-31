import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CreatePostForm } from './create-post-form';
import { ToastProvider } from '../contexts/ToastContext';

// --- Mocks ---

const mockCreatePost = vi.fn().mockResolvedValue({ id: 'post-new', content: 'Test' });

vi.mock('../lib/api', () => ({
  createPost: (...args: any[]) => mockCreatePost(...args),
  searchUsers: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/contentOwnership', () => ({
  contentOwnershipService: { registerContent: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../services/wallet', () => ({
  walletService: { getConnectedWallet: vi.fn().mockReturnValue(null) },
}));

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

// --- Helpers ---

function renderForm() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <CreatePostForm />
      </ToastProvider>
    </MemoryRouter>
  );
}

// --- Tests ---

describe('CreatePostForm poll creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Add Poll button', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /add poll/i })).toBeInTheDocument();
  });

  it('shows poll form when Add Poll is clicked', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: /add poll/i }));

    expect(screen.getByPlaceholderText('Poll Question')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Option 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Option 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove poll/i })).toBeInTheDocument();
  });

  it('hides poll form when Remove Poll is clicked', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: /add poll/i }));
    expect(screen.getByPlaceholderText('Poll Question')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /remove poll/i }));
    expect(screen.queryByPlaceholderText('Poll Question')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add poll/i })).toBeInTheDocument();
  });

  it('adds a new option when Add Option is clicked', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: /add poll/i }));

    expect(screen.getByPlaceholderText('Option 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Option 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add option/i }));

    expect(screen.getByPlaceholderText('Option 3')).toBeInTheDocument();
  });

  it('sends poll data on submit', async () => {
    const user = userEvent.setup();
    renderForm();

    // Add content
    const textarea = screen.getByPlaceholderText(/what's on your mind/i);
    await user.type(textarea, 'My poll post');

    // Open poll form
    await user.click(screen.getByRole('button', { name: /add poll/i }));

    // Fill poll question
    await user.type(screen.getByPlaceholderText('Poll Question'), 'Color?');
    // Fill options
    await user.type(screen.getByPlaceholderText('Option 1'), 'Red');
    await user.type(screen.getByPlaceholderText('Option 2'), 'Blue');

    // Submit form (use the submit button, not "Schedule Post")
    const submitBtn = screen.getByRole('button', { name: /^post$/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalled();
    });

    const pollArg = mockCreatePost.mock.calls[0][9];
    expect(pollArg).toEqual({ question: 'Color?', options: ['Red', 'Blue'] });
  });

  it('sends null poll when not added', async () => {
    const user = userEvent.setup();
    renderForm();

    const textarea = screen.getByPlaceholderText(/what's on your mind/i);
    await user.type(textarea, 'Just text');

    const submitBtn = screen.getByRole('button', { name: /^post$/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalled();
    });

    const pollArg = mockCreatePost.mock.calls[0][9];
    expect(pollArg).toBeNull();
  });

  it('updates question input when typing', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: /add poll/i }));

    const questionInput = screen.getByPlaceholderText('Poll Question');
    await user.type(questionInput, 'My question');
    expect(questionInput).toHaveValue('My question');
  });
});
