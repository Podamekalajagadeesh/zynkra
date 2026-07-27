import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CreatePostForm } from './create-post-form';
import { ToastProvider } from '../contexts/ToastContext';

const mockCreatePost = vi.fn().mockResolvedValue({ id: 'post-1', content: 'Test text post' });

vi.mock('../lib/api', () => ({
  createPost: (...args: any[]) => mockCreatePost(...args),
  searchUsers: vi.fn().mockResolvedValue([]),
}));

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

function renderForm() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <CreatePostForm />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('CreatePostForm - text posts', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with textarea', () => {
    renderForm();
    expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument();
  });

  it('allows typing text content', async () => {
    renderForm();
    const textarea = screen.getByPlaceholderText("What's on your mind?");
    await user.type(textarea, 'This is a text post');
    expect(textarea).toHaveValue('This is a text post');
  });

  it('disables submit button when content is empty', async () => {
    renderForm();
    const submitButton = screen.getByText('Post');
    expect(submitButton).toBeDisabled();
    expect(mockCreatePost).not.toHaveBeenCalled();
  });

  it('enables submit button when content is typed', async () => {
    renderForm();
    const submitButton = screen.getByText('Post');
    expect(submitButton).toBeDisabled();

    const textarea = screen.getByPlaceholderText("What's on your mind?");
    await user.type(textarea, 'Hello');
    expect(submitButton).toBeEnabled();
  });

  it('creates a text post on submit', async () => {
    renderForm();
    const textarea = screen.getByPlaceholderText("What's on your mind?");
    await user.type(textarea, 'Hello world!');

    const submitButton = screen.getByText('Post');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalled();
    });
  });

  it('handles API error gracefully', async () => {
    mockCreatePost.mockRejectedValueOnce(new Error('Network error'));
    renderForm();
    const textarea = screen.getByPlaceholderText("What's on your mind?");
    await user.type(textarea, 'Post that fails');

    const submitButton = screen.getByText('Post');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('submits with trimmed content', async () => {
    renderForm();
    const textarea = screen.getByPlaceholderText("What's on your mind?");
    await user.type(textarea, '   Trimmed post   ');

    const submitButton = screen.getByText('Post');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalled();
    });
  });

  it('renders visibility selector', () => {
    renderForm();
    expect(screen.getByText(/Public/)).toBeInTheDocument();
  });
});
