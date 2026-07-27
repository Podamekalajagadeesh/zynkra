import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CreatePost } from './CreatePost';
import { ToastProvider } from '../contexts/ToastContext';

const mockCreatePost = vi.fn().mockResolvedValue({ id: 'post-1', content: 'Test post' });
const mockNavigate = vi.fn();

vi.mock('../lib/api', () => ({
  createPost: (...args: any[]) => mockCreatePost(...args),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock('../services/contentModerationService', () => ({
  analyzeContent: vi.fn().mockResolvedValue({
    isHarmful: false,
    isMisinformation: false,
    recommendedAction: 'allow',
    autoTags: [],
  }),
}));

vi.mock('./StickerLibrary', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="sticker-library">
      <button onClick={onClose}>Close Stickers</button>
    </div>
  ),
}));

vi.mock('./dms/TagFriendsModal', () => ({
  TagFriendsModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="tag-friends-modal">
      <button onClick={onClose}>Close Tagging</button>
    </div>
  ),
}));

vi.mock('./generative-ai/AIContentGenerator', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="ai-generator">
      <button onClick={onClose}>Close AI</button>
    </div>
  ),
}));

vi.mock('./PhotoEditor', () => ({
  PhotoEditor: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="photo-editor">
      <button onClick={onClose}>Close Editor</button>
    </div>
  ),
}));

vi.mock('./podcast/PodcastRecorder', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="podcast-recorder">
      <button onClick={onClose}>Close Podcast</button>
    </div>
  ),
}));

vi.mock('./moderation/ContentWarningBanner', () => ({
  ContentWarningBanner: () => <div data-testid="content-warning" />,
}));

function renderCreatePost() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <CreatePost />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('CreatePost', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the create post form with textarea', () => {
    renderCreatePost();
    expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument();
    expect(screen.getByText('Post')).toBeInTheDocument();
  });

  it('renders all action buttons', () => {
    renderCreatePost();
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText(/Photo/)).toBeInTheDocument();
    expect(screen.getByText(/Video/)).toBeInTheDocument();
    expect(screen.getByText(/Tag People/)).toBeInTheDocument();
    expect(screen.getByText(/AI Generate/)).toBeInTheDocument();
    expect(screen.getByText(/Podcast/)).toBeInTheDocument();
    expect(screen.getByText(/Thought-to-Post/)).toBeInTheDocument();
  });

  it('allows typing content in textarea', async () => {
    renderCreatePost();
    const textarea = screen.getByPlaceholderText("What's on your mind?");
    await user.type(textarea, 'Hello world!');
    expect(textarea).toHaveValue('Hello world!');
  });

  it('allows typing activity', async () => {
    renderCreatePost();
    const activityInput = screen.getByPlaceholderText('What are you feeling or doing?');
    await user.type(activityInput, 'Having fun');
    expect(activityInput).toHaveValue('Having fun');
  });

  it('shows validation warning when submitting empty text post', async () => {
    renderCreatePost();
    await user.click(screen.getByText('Post'));
    // Should show warning toast - mockCreatePost should not be called
    expect(mockCreatePost).not.toHaveBeenCalled();
  });

  it('submits a text post with content', async () => {
    renderCreatePost();
    const textarea = screen.getByPlaceholderText("What's on your mind?");
    await user.type(textarea, 'My new post!');
    await user.click(screen.getByText('Post'));

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalled();
    });
  });

  it('calls navigate after successful post creation', async () => {
    renderCreatePost();
    const textarea = screen.getByPlaceholderText("What's on your mind?");
    await user.type(textarea, 'Test post for navigation');
    await user.click(screen.getByText('Post'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('opens sticker modal when GIF button clicked', async () => {
    renderCreatePost();
    await user.click(screen.getByText(/GIF/));
    expect(screen.getByTestId('sticker-library')).toBeInTheDocument();
  });

  it('opens tag friends modal when Tag People clicked', async () => {
    renderCreatePost();
    await user.click(screen.getByText(/Tag People/));
    expect(screen.getByTestId('tag-friends-modal')).toBeInTheDocument();
  });

  it('opens AI generator when AI Generate clicked', async () => {
    renderCreatePost();
    await user.click(screen.getByText(/AI Generate/));
    expect(screen.getByTestId('ai-generator')).toBeInTheDocument();
  });

  it('opens podcast recorder when Podcast clicked', async () => {
    renderCreatePost();
    await user.click(screen.getByText(/Podcast/));
    expect(screen.getByTestId('podcast-recorder')).toBeInTheDocument();
  });

  it('closes dialog when X button clicked', async () => {
    renderCreatePost();
    const closeButton = screen.getByLabelText('Close create post dialog');
    await user.click(closeButton);
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('handles API error gracefully', async () => {
    mockCreatePost.mockRejectedValueOnce(new Error('API error'));
    renderCreatePost();
    const textarea = screen.getByPlaceholderText("What's on your mind?");
    await user.type(textarea, 'Post that will fail');
    await user.click(screen.getByText('Post'));

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalled();
    });
    // Should not navigate on error
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
