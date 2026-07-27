import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateNote } from './CreateNote';

const mockCreateNote = vi.fn().mockResolvedValue({ id: 'note-1', content: 'Test note', userId: 'user-1', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString() });

vi.mock('../../lib/api/notes', () => ({
  createNote: (...args: any[]) => mockCreateNote(...args),
}));

describe('CreateNote', () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const onNoteCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the create note form', () => {
    render(<CreateNote onClose={onClose} onNoteCreated={onNoteCreated} />);
    expect(screen.getByText('Create a Note')).toBeInTheDocument();
    expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument();
  });

  it('calls onClose when Cancel clicked', async () => {
    render(<CreateNote onClose={onClose} onNoteCreated={onNoteCreated} />);
    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('creates a note on submit', async () => {
    render(<CreateNote onClose={onClose} onNoteCreated={onNoteCreated} />);
    const textarea = screen.getByPlaceholderText("What's on your mind?");
    await user.type(textarea, 'My short note');

    await user.click(screen.getByText('Post'));

    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith('My short note');
    });
    expect(onNoteCreated).toHaveBeenCalledWith(expect.objectContaining({ id: 'note-1', content: 'Test note' }));
  });

  it('does not submit empty content', async () => {
    render(<CreateNote onClose={onClose} onNoteCreated={onNoteCreated} />);
    await user.click(screen.getByText('Post'));
    expect(mockCreateNote).not.toHaveBeenCalled();
  });
});
